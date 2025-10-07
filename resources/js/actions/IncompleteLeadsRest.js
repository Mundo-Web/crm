import BasicRest from "./BasicRest";
import LeadsRest from "./LeadsRest";

class ImcompleteLeadsRest extends LeadsRest {
  path = 'leads'
  paginateSufix = 'incomplete'
}

export default ImcompleteLeadsRest