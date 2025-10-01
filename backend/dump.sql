--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP TABLE IF EXISTS public.candidates, public.users, public.elections, public.eci_admin_data, public.digilocker_mock_data CASCADE;
DROP SEQUENCE IF EXISTS public.users_id_seq, public.eci_admin_data_id_seq, public.digilocker_mock_data_id_seq, public.candidates_id_seq;

SET default_tablespace = '';
SET default_table_access_method = heap;

--
-- Name: candidates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.candidates (
    id integer NOT NULL,
    election_id integer NOT NULL,
    candidate_id integer NOT NULL,
    candidate_name text NOT NULL,
    constituency_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: candidates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.candidates_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.candidates_id_seq OWNED BY public.candidates.id;


--
-- Name: digilocker_mock_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.digilocker_mock_data (
    id integer NOT NULL,
    phone_number character varying(15) NOT NULL,
    uid character varying(20) NOT NULL,
    dob date NOT NULL,
    full_name character varying(100) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE public.digilocker_mock_data_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.digilocker_mock_data_id_seq OWNED BY public.digilocker_mock_data.id;

--
-- Name: eci_admin_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.eci_admin_data (
    id integer NOT NULL,
    uid_hash character varying(64) NOT NULL,
    ac_name character varying(200) NOT NULL,
    pc_name character varying(200) NOT NULL,
    ward_number character varying(50),
    enc_private_key bytea,
    wallet_address text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    ac_id integer,
    pc_id integer
);

CREATE SEQUENCE public.eci_admin_data_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.eci_admin_data_id_seq OWNED BY public.eci_admin_data.id;


--
-- Name: elections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.elections (
    election_id integer NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    start_time timestamp with time zone NOT NULL, -- Use TIMESTAMPTZ
    end_time timestamp with time zone NOT NULL,   -- Use TIMESTAMPTZ
    enabled_constituencies integer[],
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT elections_type_check CHECK ((type = ANY (ARRAY['STATE_LEGISLATIVE'::text, 'PARLIAMENTARY'::text])))
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(100) NOT NULL,
    uid_hash character varying(64) NOT NULL,
    password character varying(100) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    last_login timestamp with time zone
);


CREATE SEQUENCE public.users_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;

ALTER TABLE ONLY public.candidates ALTER COLUMN id SET DEFAULT nextval('public.candidates_id_seq'::regclass);
ALTER TABLE ONLY public.digilocker_mock_data ALTER COLUMN id SET DEFAULT nextval('public.digilocker_mock_data_id_seq'::regclass);
ALTER TABLE ONLY public.eci_admin_data ALTER COLUMN id SET DEFAULT nextval('public.eci_admin_data_id_seq'::regclass);
ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);

--
-- Data for Name: candidates; Type: TABLE DATA; Schema: public; Owner: -
--
COPY public.candidates (id, election_id, candidate_id, candidate_name, constituency_id, created_at) FROM stdin;
1	101	0	Aarav Sharma	1	'2025-09-29 12:00:00+00'
2	101	1	Priya Patel	1	'2025-09-29 12:00:00+00'
\.

--
-- Data for Name: digilocker_mock_data; Type: TABLE DATA; Schema: public; Owner: -
--
COPY public.digilocker_mock_data (id, phone_number, uid, dob, full_name, created_at) FROM stdin;
1	9876543210	123456789012	1990-05-15	Rajesh Kumar	'2025-09-24 11:29:17.358453+00'
2	9876543211	123456789013	1985-12-03	Priya Sharma	'2025-09-24 11:29:17.358453+00'
3	9876543212	123456789014	1992-08-22	Amit Patel	'2025-09-24 11:29:17.358453+00'
\.

--
-- Data for Name: eci_admin_data; Type: TABLE DATA; Schema: public; Owner: -
--
COPY public.eci_admin_data (id, uid_hash, ac_name, pc_name, ward_number, enc_private_key, wallet_address, created_at, updated_at, ac_id, pc_id) FROM stdin;
1	2a33349e7e606a8ad2e30e3c84521f9377450cf09083e162e0a9b1480ce0f972	AC 1	PC 1	Ward 001	\N	\N	'2025-09-24 11:29:17.367329+00'	'2025-09-24 11:29:17.367329+00'	1	1
2	0e9feee8dd5d0d722ae507aecc216984c603cfb41bbc8f8b2313eef72409cd84	AC 2	PC 2	Ward 002	\N	\N	'2025-09-24 11:29:17.367329+00'	'2025-09-24 11:29:17.367329+00'	2	2
3	d13dda0de247e23cfbb377605fcb7ddc5876feb0126eb336de4d893b173cf96f	AC 3	PC 3	Ward 003	\N	\N	'2025-09-24 11:29:17.367329+00'	'2025-09-24 11:29:17.367329+00'	3	3
\.

--
-- Data for Name: elections; Type: TABLE DATA; Schema: public; Owner: -
--
COPY public.elections (election_id, name, type, start_time, end_time, enabled_constituencies, created_at) FROM stdin;
101	Test-State-Election -2025	STATE_LEGISLATIVE	'2025-09-01 00:00:00+00'	'2025-10-31 23:59:59+00'	{1}	'2025-09-29 12:00:00+00'
\.

--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--
COPY public.users (id, username, uid_hash, password, created_at, last_login) FROM stdin;
\.

--
-- Sequence SET
--
SELECT pg_catalog.setval('public.candidates_id_seq', 2, true);
SELECT pg_catalog.setval('public.digilocker_mock_data_id_seq', 3, true);
SELECT pg_catalog.setval('public.eci_admin_data_id_seq', 3, true);
SELECT pg_catalog.setval('public.users_id_seq', 1, false);

--
-- Constraints
--
ALTER TABLE ONLY public.candidates ADD CONSTRAINT candidates_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.digilocker_mock_data ADD CONSTRAINT digilocker_mock_data_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.eci_admin_data ADD CONSTRAINT eci_admin_data_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.elections ADD CONSTRAINT elections_pkey PRIMARY KEY (election_id);
ALTER TABLE ONLY public.users ADD CONSTRAINT users_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.candidates ADD CONSTRAINT candidates_unique UNIQUE (election_id, candidate_id, constituency_id);
ALTER TABLE ONLY public.digilocker_mock_data ADD CONSTRAINT digilocker_mock_data_phone_number_key UNIQUE (phone_number);
ALTER TABLE ONLY public.digilocker_mock_data ADD CONSTRAINT digilocker_mock_data_uid_key UNIQUE (uid);
ALTER TABLE ONLY public.eci_admin_data ADD CONSTRAINT eci_admin_data_uid_hash_key UNIQUE (uid_hash);
ALTER TABLE ONLY public.users ADD CONSTRAINT users_uid_hash_key UNIQUE (uid_hash);
ALTER TABLE ONLY public.users ADD CONSTRAINT users_username_key UNIQUE (username);
ALTER TABLE ONLY public.candidates ADD CONSTRAINT candidates_election_id_fkey FOREIGN KEY (election_id) REFERENCES public.elections(election_id);

--
-- PostgreSQL database dump complete
--

