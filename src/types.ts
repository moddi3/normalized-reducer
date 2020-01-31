//
// Op: an atomic unit-of-work which a relational reducer can act upon
//

export enum OpTypes {
  ADD_RESOURCE = 'ADD_RESOURCE',
  REMOVE_RESOURCE = 'REMOVE_RESOURCE',
  EDIT_RESOURCE = 'EDIT_RESOURCE',
  MOVE_RESOURCE = 'MOVE_RESOURCE',
  ADD_REL_ID = 'ADD_REL_ID',
  REMOVE_REL_ID = 'REMOVE_REL_ID',
  MOVE_REL_ID = 'MOVE_REL_ID',
}

export interface Op {
  opType: string;
  entity: string;
}

export interface AddResourceOp extends Op {
  id: string;
  opType: OpTypes.ADD_RESOURCE;
  data?: object;
  index?: number;
}

export interface RemoveResourceOp extends Op {
  id: string;
  opType: OpTypes.REMOVE_RESOURCE;
}

export interface EditResourceOp extends Op {
  id: string;
  opType: OpTypes.EDIT_RESOURCE;
  data: { [key: string]: any };
}

export interface MoveResourceOp extends Op {
  opType: OpTypes.MOVE_RESOURCE;
  src: number;
  dest: number;
}

export interface AddRelIdOp extends Op {
  id: string;
  rel: string;
  relId: string;
  index?: number;
  reciprocalIndex?: number;
}

export interface RemoveRelIdOp extends Op {
  id: string;
  rel: string;
  relId?: string;
}

export interface MoveRelIdOp extends Op {
  id: string;
  rel: string;
  src: number;
  dest: number;
}

//
// Action: a request object that is an argument to the reducer
//

export interface Action {
  type: string;
}

export interface OpAction extends Action {
  ops?: Op[];
}

// actions
export interface AddAction extends OpAction {
  entity: string;
  id: string;
  data?: object;
  attach?: AddAttachable[];
  index?: number;
}

export interface AddAttachable {
  rel: string;
  id: string;
  index?: number;
  reciprocalIndex?: number;
}

export interface RemoveAction extends OpAction {
  entity: string;
  id: string;
  removalSchema?: SelectorTreeSchema;
}

export interface EditAction extends OpAction {
  entity: string;
  id: string;
  data: object;
}

export interface MoveAction extends Omit<OpAction, 'id'> {
  entity: string;
  src: number;
  dest: number;
}

export interface AttachAction extends OpAction {
  entity: string;
  id: string;
  rel: string;
  relId: string;
  index?: number; // the index within the base resource where the relId should be placed
  reciprocalIndex?: number; // the index within the rel resource where base id should be placed
}

export interface DetachAction extends OpAction {
  entity: string;
  id: string;
  rel: string;
  relId: string;
}

export interface MoveAttachedAction extends OpAction {
  entity: string;
  id: string;
  rel: string;
  src: number;
  dest: number;
}

export type ConcreteOpAction =
  | AddAction
  | RemoveAction
  | EditAction
  | MoveAction
  | AttachAction
  | DetachAction
  | MoveAttachedAction;

export interface BatchAction extends Action {
  actions: ConcreteOpAction[];
  ops?: Op[];
}

export interface SetStateAction {
  type: string;
  state: State;
}

export interface SetAllIdsAction {
  type: string;
  state: IdsByEntity;
}

export interface SetAllResourcesAction {
  type: string;
  state: ResourcesByEntity;
}

export interface SetIdsAction {
  type: string;
  entity: string;
  state: string[];
}

export interface SetResourcesAction {
  type: string;
  entity: string;
  state: Resources;
}

export interface SetResourceAction {
  type: string;
  entity: string;
  id: string;
  state: Resource;
}

// action creators
export type AddActionCreator = (
  entity: string,
  id: string,
  data?: object,
  attach?: AddAttachable[],
  index?: number
) => AddAction;
export type RemoveActionCreator = (
  entity: string,
  id: string,
  removalSchema?: SelectorTreeSchema
) => RemoveAction;
export type EditActionCreator = (
  entity: string,
  id: string,
  data: object
) => EditAction;
export type MoveActionCreator = (
  entity: string,
  src: number,
  dest: number
) => MoveAction;
export type AttachActionCreator = (
  entity: string,
  id: string,
  rel: string,
  relId: string,
  opts?: { index?: number; reciprocalIndex?: number }
) => AttachAction;
export type DetachActionCreator = (
  entity: string,
  id: string,
  rel: string,
  relId: string
) => DetachAction;
export type MoveAttachedActionCreator = (
  entity: string,
  id: string,
  rel: string,
  src: number,
  dest: number
) => MoveAttachedAction;
export type BatchActionCreator = (
  ...actions: ConcreteOpAction[]
) => BatchAction;
export type SetStateActionCreator = (state: State) => SetStateAction;
export type SetAllIdsActionCreator = (state: IdsByEntity) => SetAllIdsAction;
export type SetAllResourcesActionCreator = (
  state: ResourcesByEntity
) => SetAllResourcesAction;
export type SetIdsActionCreator = (
  entity: string,
  state: string[]
) => SetIdsAction;
export type SetResourcesActionCreator = (
  entity: string,
  state: Resources
) => SetResourcesAction;
export type SetResourceActionCreator = (
  entity: string,
  id: string,
  state: Resource
) => SetResourceAction;

export interface ActionTypes {
  ADD: string;
  REMOVE: string;
  EDIT: string;
  MOVE: string;
  ATTACH: string;
  DETACH: string;
  MOVE_ATTACHED: string;
  BATCH: string;
  SET_STATE: string;
  SET_ALL_IDS: string;
  SET_ALL_RESOURCES: string;
  SET_IDS: string;
  SET_RESOURCES: string;
  SET_RESOURCE: string;
}

export interface ActionCreators {
  add: AddActionCreator;
  remove: RemoveActionCreator;
  edit: EditActionCreator;
  move: MoveActionCreator;
  attach: AttachActionCreator;
  detach: DetachActionCreator;
  moveAttached: MoveAttachedActionCreator;
  batch: BatchActionCreator;
  setState: SetStateActionCreator;
  setAllIds: SetAllIdsActionCreator;
  setAllResources: SetAllResourcesActionCreator;
  setIds: SetIdsActionCreator;
  setResources: SetResourcesActionCreator;
  setResource: SetResourceActionCreator;
}

//
// schema types
//

export interface ModelSchema {
  [entity: string]: EntitySchema;
}

export interface EntitySchema {
  [rel: string]: RelSchema;
}

export type RelSchema = {
  entity: string;
  cardinality: Cardinality;
  reciprocal: string;
};

export type Cardinality = Cardinalities[keyof Cardinalities];

export enum Cardinalities {
  ONE = 'one',
  MANY = 'many',
}

//
// state types todo: remove state suffix
//

export type State = {
  resources: ResourcesByEntity;
  ids: IdsByEntity;
};
export type IdsByEntity = { [entity: string]: string[] };
export type ResourcesByEntity = { [entity: string]: Resources };
export type Resources = { [id: string]: Resource };
export type Resource = { [attr: string]: RelData | any };
export type RelData = undefined | string | string[];

//
// selector types
//

export type DeriveActionWithOps = (state: State, action: OpAction) => OpAction;
export type GetAllIds = (state: State) => IdsByEntity;
export type GetAllResources = (state: State) => ResourcesByEntity;
export type GetIds = (state: State, args: { entity: string }) => string[];
export type GetResources = (
  state: State,
  args: { entity: string }
) => Resources;
export type CheckResource = (
  state: State,
  args: { entity: string; id: string }
) => boolean;
export type GetResource = (
  state: State,
  args: { entity: string; id: string }
) => Resource | undefined;
export type GetAttached = (
  state: State,
  args: { entity: string; id: string; rel: string }
) => string[] | string | undefined;
export type GetAttachedArr = (
  state: State,
  args: { entity: string; id: string; rel: string }
) => string[];
export type GetAllAttachedArr = (
  state: State,
  args: { entity: string; id: string }
) => { [rel: string]: string[] };
export type GetResourceTree = (
  state: State,
  args: { entity: string; id: string; schema: SelectorTreeSchema }
) => ResourceTreeNode[];
export type CheckAttached = (
  state: State,
  args: { entity: string; id: string; rel: string; relId: string }
) => boolean;

export interface Selectors {
  getAllIds: GetAllIds;
  getAllResources: GetAllResources;
  getIds: GetIds;
  getResources: GetResources;
  checkResource: CheckResource;
  getResource: GetResource;
  getAttached: GetAttached;
  getAttachedArr: GetAttachedArr;
  getAllAttachedArr: GetAllAttachedArr;
  getResourceTree: GetResourceTree;
  checkAttached: CheckAttached;
}

export type SelectorTreeSchema =
  | { [rel: string]: SelectorTreeSchema }
  | (() => SelectorTreeSchema);
export type ResourceTreeNode = { id: string; entity: string; resource: object };

//
// reducer types
//

export type EntityIdsReducer = (state: string[], ops: Op[]) => string[];
export interface EntityIdsReducers {
  [entity: string]: EntityIdsReducer;
}

export type EntityReducer = (state: Resources, ops: Op[]) => Resources;
export interface EntityReducers {
  [entity: string]: EntityReducer;
}

//
// option types
//

export interface Options {
  namespaced: Namespaced;
  resolveRelFromEntity: boolean;
  onInvalidEntity: InvalidEntityHandler;
  onInvalidRel: InvalidRelHandler;
  onInvalidRelData: InvalidRelDataHandler;
  onNonexistentResource: NonexistentResourceHandler;
}

export type InvalidEntityHandler = (entity: string) => void;
export type NonexistentResourceHandler = (entity: string, id: string) => void;
export type InvalidRelHandler = (entity: string, rel: string) => void;
export type InvalidRelDataHandler = (entity: string, rel: string) => void;

export type ExistingResourceStrategy = 'ignore' | 'put' | 'patch'; // put replaces completely; patch merges their attached ids

export type Namespaced = (actionType: string) => string;
