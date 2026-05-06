begin;

create table users
(
	id serial primary key
);

create table actions
(
	user_id int,
	id serial,
	time timestamptz,
	page text,
	primary key (user_id, id),
	foreign key (user_id)
		references users (id)
		on delete cascade
);

create table pattern_tree_nodes
(
	user_id int,
	id serial,
	parent_id int,
	strict_traits jsonb,
	primary key (user_id, id),
	foreign key (user_id, parent_id)
		references pattern_tree_nodes (user_id, id)
		on delete cascade,
	foreign key (user_id)
		references users (id)
		on delete cascade
);

create table pattern_tree_nodes_actions
(
	user_id int,
	node_id int,
	action_id int,
	primary key (user_id, node_id, action_id),
	foreign key (user_id, node_id)
		references pattern_tree_nodes (user_id, id)
		on delete cascade,
	foreign key (user_id, action_id)
		references actions (user_id, id)
		on delete cascade
);

commit;