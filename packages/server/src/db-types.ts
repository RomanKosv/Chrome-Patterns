import type {StrictTraitsSet} from "@chrome-patterns/shared/actions";

export interface User {
  id: number,
  max_pattern_lenght : number,
  username : string
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
