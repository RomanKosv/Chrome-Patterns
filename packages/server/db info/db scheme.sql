--
-- PostgreSQL database dump
--

\restrict qsEhohbl5iNlGAGUSfqsJ1l2ROTHzyPtXy2MeVrfWmhB9optsXHIfskdSJAZB1s

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

-- Started on 2026-05-06 11:18:06

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 6 (class 2615 OID 24760)
-- Name: cache; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA cache;


ALTER SCHEMA cache OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 223 (class 1259 OID 24702)
-- Name: actions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.actions (
    user_id integer NOT NULL,
    id integer NOT NULL,
    "time" timestamp with time zone,
    page text
);


ALTER TABLE public.actions OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 24701)
-- Name: actions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.actions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.actions_id_seq OWNER TO postgres;

--
-- TOC entry 4942 (class 0 OID 0)
-- Dependencies: 222
-- Name: actions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.actions_id_seq OWNED BY public.actions.id;


--
-- TOC entry 225 (class 1259 OID 24718)
-- Name: pattern_tree_nodes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pattern_tree_nodes (
    user_id integer NOT NULL,
    id integer NOT NULL,
    parent_id integer,
    strict_traits jsonb,
    enter_count integer,
    last_visit_time timestamp with time zone,
    CONSTRAINT pattern_tree_nodes_enter_count_check CHECK ((enter_count >= 0))
);


ALTER TABLE public.pattern_tree_nodes OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 24738)
-- Name: pattern_tree_nodes_actions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pattern_tree_nodes_actions (
    user_id integer NOT NULL,
    node_id integer NOT NULL,
    action_id integer NOT NULL
);


ALTER TABLE public.pattern_tree_nodes_actions OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 24717)
-- Name: pattern_tree_nodes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pattern_tree_nodes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pattern_tree_nodes_id_seq OWNER TO postgres;

--
-- TOC entry 4943 (class 0 OID 0)
-- Dependencies: 224
-- Name: pattern_tree_nodes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pattern_tree_nodes_id_seq OWNED BY public.pattern_tree_nodes.id;


--
-- TOC entry 221 (class 1259 OID 24694)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    max_pattern_lenght integer,
    CONSTRAINT users_max_pattern_lenght_check CHECK ((max_pattern_lenght > 0))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 24693)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 4944 (class 0 OID 0)
-- Dependencies: 220
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 4771 (class 2604 OID 24705)
-- Name: actions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actions ALTER COLUMN id SET DEFAULT nextval('public.actions_id_seq'::regclass);


--
-- TOC entry 4772 (class 2604 OID 24721)
-- Name: pattern_tree_nodes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pattern_tree_nodes ALTER COLUMN id SET DEFAULT nextval('public.pattern_tree_nodes_id_seq'::regclass);


--
-- TOC entry 4770 (class 2604 OID 24697)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 4778 (class 2606 OID 24711)
-- Name: actions actions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actions
    ADD CONSTRAINT actions_pkey PRIMARY KEY (user_id, id);


--
-- TOC entry 4784 (class 2606 OID 24745)
-- Name: pattern_tree_nodes_actions pattern_tree_nodes_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pattern_tree_nodes_actions
    ADD CONSTRAINT pattern_tree_nodes_actions_pkey PRIMARY KEY (user_id, node_id, action_id);


--
-- TOC entry 4780 (class 2606 OID 24727)
-- Name: pattern_tree_nodes pattern_tree_nodes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pattern_tree_nodes
    ADD CONSTRAINT pattern_tree_nodes_pkey PRIMARY KEY (user_id, id);


--
-- TOC entry 4782 (class 2606 OID 24759)
-- Name: pattern_tree_nodes pattern_tree_nodes_user_id_parent_id_strict_traits_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pattern_tree_nodes
    ADD CONSTRAINT pattern_tree_nodes_user_id_parent_id_strict_traits_key UNIQUE NULLS NOT DISTINCT (user_id, parent_id, strict_traits);


--
-- TOC entry 4776 (class 2606 OID 24700)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4785 (class 2606 OID 24712)
-- Name: actions actions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actions
    ADD CONSTRAINT actions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4788 (class 2606 OID 24751)
-- Name: pattern_tree_nodes_actions pattern_tree_nodes_actions_user_id_action_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pattern_tree_nodes_actions
    ADD CONSTRAINT pattern_tree_nodes_actions_user_id_action_id_fkey FOREIGN KEY (user_id, action_id) REFERENCES public.actions(user_id, id) ON DELETE CASCADE;


--
-- TOC entry 4789 (class 2606 OID 24746)
-- Name: pattern_tree_nodes_actions pattern_tree_nodes_actions_user_id_node_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pattern_tree_nodes_actions
    ADD CONSTRAINT pattern_tree_nodes_actions_user_id_node_id_fkey FOREIGN KEY (user_id, node_id) REFERENCES public.pattern_tree_nodes(user_id, id) ON DELETE CASCADE;


--
-- TOC entry 4786 (class 2606 OID 24733)
-- Name: pattern_tree_nodes pattern_tree_nodes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pattern_tree_nodes
    ADD CONSTRAINT pattern_tree_nodes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4787 (class 2606 OID 24728)
-- Name: pattern_tree_nodes pattern_tree_nodes_user_id_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pattern_tree_nodes
    ADD CONSTRAINT pattern_tree_nodes_user_id_parent_id_fkey FOREIGN KEY (user_id, parent_id) REFERENCES public.pattern_tree_nodes(user_id, id) ON DELETE CASCADE;


-- Completed on 2026-05-06 11:18:07

--
-- PostgreSQL database dump complete
--

\unrestrict qsEhohbl5iNlGAGUSfqsJ1l2ROTHzyPtXy2MeVrfWmhB9optsXHIfskdSJAZB1s

