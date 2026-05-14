using { db } from '../db/schema';
 
service MyService {
 
    @odata.draft.enabled
    entity Products as projection on db.Products;
  
 
}

