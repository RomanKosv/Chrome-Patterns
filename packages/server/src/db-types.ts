import type {StrictTraitsSet} from "./abstract-actions.js";

export interface User {
  id: number,
  max_pattern_lenght : number
}

export interface Action {
  user_id: number;
  id: number;
  time: Date;
  page: string;
}

export interface PatternTreeNode {
  user_id: number;
  id: number;
  parent_id: number | null;
  strict_traits: StrictTraitsSet,
  enter_count : number,
  last_visit_time : Date
}

export interface PatternTreeNodeAction {
  user_id: number;
  node_id: number;
  action_id: number;
}
