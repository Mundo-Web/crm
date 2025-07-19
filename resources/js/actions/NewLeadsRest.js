import BasicRest from "./BasicRest";
import LeadsRest from "./LeadsRest";

class NewLeadsRest extends LeadsRest {
  path = 'leads'
  paginateSufix = 'new'
}

export default NewLeadsRest