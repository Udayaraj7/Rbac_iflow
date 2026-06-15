const express = require("express");
const app = express();
const conn = require("./db"); // Your SAP HANA connection file

app.use(express.json());

// ── Database Helper ──
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    conn.exec(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// ── Tool Definitions ──
const tools = [
  {
    name: "get_product",
    description: "Get product details by ID",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"]
    }
  },
  {
    name: "create_product",
    description: "Create a new product",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        productname: { type: "string" },
        type: { type: "string" },
        price: { type: "string" }
      },
      required: ["id", "productname", "type", "price"]
    }
  },
  {
    name: "update_product",
    description: "Update an existing product",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        productname: { type: "string" },
        type: { type: "string" },
        price: { type: "string" }
      },
      required: ["id"]
    }
  },
  {
    name: "delete_product",
    description: "Delete a product by ID",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"]
    }
  },
  {
  name: "list_all_products",
  description: "Retrieve a list of all products in the inventory",
  inputSchema: {
    type: "object",
    properties: {}
  }
},
];

// ── Database Handlers ──

async function handleListAllProducts() {
  try {
    const rows = await query(`SELECT * FROM DB_PRODUCTS`);
    if (!rows.length) return { content: [{ type: "text", text: "No products found in the database." }] };
    
    // Formatting the output as a table-like JSON string for the AI to read easily
    return { 
      content: [{ 
        type: "text", 
        text: `Found ${rows.length} products:\n${JSON.stringify(rows, null, 2)}` 
      }] 
    };
  } catch (err) {
    return { content: [{ type: "text", text: `Error: ${err.message}` }], isError: true };
  }
}

async function handleGetProduct(args) {
  try {
    const rows = await query(`SELECT * FROM DB_PRODUCTS WHERE ID = ?`, [args.id]);
    if (!rows.length) return { content: [{ type: "text", text: `Product ${args.id} not found.` }] };
    return { content: [{ type: "text", text: JSON.stringify(rows[0], null, 2) }] };
  } catch (err) {
    return { content: [{ type: "text", text: `Error: ${err.message}` }], isError: true };
  }
}

async function handleCreateProduct(args) {
  try {
    await query(
      `INSERT INTO DB_PRODUCTS (ID, PRODUCTNAME, TYPE, PRICE) VALUES (?,?,?,?)`,
      [args.id, args.productname, args.type, args.price]
    );
    return { content: [{ type: "text", text: `Product ${args.id} created successfully.` }] };
  } catch (err) {
    return { content: [{ type: "text", text: `Error: ${err.message}` }], isError: true };
  }
}

// async function handleUpdateProduct(args) {
//   try {
//     await query(
//       `UPDATE DB_PRODUCTS SET PRODUCTNAME=?, TYPE=?, PRICE=? WHERE ID=?`,
//       [args.productname, args.type, args.price, args.id]
//     );
//     return { content: [{ type: "text", text: `Product ${args.id} updated successfully.` }] };
//   } catch (err) {
//     return { content: [{ type: "text", text: `Error: ${err.message}` }], isError: true };
//   }
// }

async function handleUpdateProduct(args) {
  try {
    // Step 1: Fetch existing product
    const existing = await query(
      `SELECT * FROM DB_PRODUCTS WHERE ID=?`,
      [args.id]
    );

    if (!existing || existing.length === 0) {
      return { content: [{ type: "text", text: `Product ${args.id} not found.` }], isError: true };
    }

    // Step 2: Merge — use new value if passed, otherwise keep old
    const updated = {
      productname: args.productname ?? existing[0].PRODUCTNAME,
      type:        args.type        ?? existing[0].TYPE,
      price:       args.price       ?? existing[0].PRICE,
    };

    // Step 3: Update with merged values
    await query(
      `UPDATE DB_PRODUCTS SET PRODUCTNAME=?, TYPE=?, PRICE=? WHERE ID=?`,
      [updated.productname, updated.type, updated.price, args.id]
    );

    return { content: [{ type: "text", text: `Product ${args.id} updated successfully.` }] };
  } catch (err) {
    return { content: [{ type: "text", text: `Error: ${err.message}` }], isError: true };
  }
}

async function handleDeleteProduct(args) {
  try {
    await query(`DELETE FROM DB_PRODUCTS WHERE ID = ?`, [args.id]);
    return { content: [{ type: "text", text: `Product ${args.id} deleted successfully.` }] };
  } catch (err) {
    return { content: [{ type: "text", text: `Error: ${err.message}` }], isError: true };
  }
}

// ── MCP JSON-RPC Handler ──
async function handleMCPRequest(body) {
  const { jsonrpc, id, method, params } = body;

  if (method === "initialize") {
    return {
      jsonrpc: "2.0", id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "sap-hana-mcp", version: "1.0.0" }
      }
    };
  }

  if (method === "tools/list") {
    return { jsonrpc: "2.0", id, result: { tools } };
  }

  if (method === "tools/call") {
    const toolName = params?.name;
    const toolArgs = params?.arguments || {};

    switch (toolName) {
      case "get_product":
        return { jsonrpc: "2.0", id, result: await handleGetProduct(toolArgs) };
      case "create_product":
        return { jsonrpc: "2.0", id, result: await handleCreateProduct(toolArgs) };
      case "update_product":
        return { jsonrpc: "2.0", id, result: await handleUpdateProduct(toolArgs) };
      case "delete_product":
        return { jsonrpc: "2.0", id, result: await handleDeleteProduct(toolArgs) };
      case "list_all_products":
        return { jsonrpc: "2.0", id, result: await handleListAllProducts() };  
      default:
        return { jsonrpc: "2.0", id, error: { code: -32601, message: `Tool not found: ${toolName}` } };
    }
  }

  return null;
}

// ── POST /mcp ──
app.post("/mcp", async (req, res) => {
  const response = await handleMCPRequest(req.body);
  if (!response) return res.status(204).send();
  return res.json(response);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`HANA MCP Server on port ${PORT}`));