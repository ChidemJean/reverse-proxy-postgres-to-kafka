CREATE SCHEMA IF NOT EXISTS _customer;

SET search_path TO pg_catalog,public,_customer;

CREATE TABLE IF NOT EXISTS _customer.list (
	id bigserial,
	parent_id bigint,
	name varchar NOT NULL,
	enabled boolean DEFAULT TRUE,
	inserted_at timestamptz NOT NULL DEFAULT NOW(),
	updated_at timestamptz NOT NULL DEFAULT NOW(),
	CONSTRAINT _customer_list_pk PRIMARY KEY (id)
);

ALTER TABLE _customer.list ADD CONSTRAINT _customer_parent_id_fk FOREIGN KEY (parent_id)
REFERENCES _customer.list (id) MATCH SIMPLE
ON DELETE NO ACTION ON UPDATE NO ACTION;