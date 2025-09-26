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

ALTER TABLE IF EXISTS ONLY public.candidates DROP CONSTRAINT IF EXISTS candidates_election_id_fkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_username_key;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_uid_hash_key;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.elections DROP CONSTRAINT IF EXISTS elections_pkey;
ALTER TABLE IF EXISTS ONLY public.eci_admin_data DROP CONSTRAINT IF EXISTS eci_admin_data_uid_hash_key;
ALTER TABLE IF EXISTS ONLY public.eci_admin_data DROP CONSTRAINT IF EXISTS eci_admin_data_pkey;
ALTER TABLE IF EXISTS ONLY public.digilocker_mock_data DROP CONSTRAINT IF EXISTS digilocker_mock_data_uid_key;
ALTER TABLE IF EXISTS ONLY public.digilocker_mock_data DROP CONSTRAINT IF EXISTS digilocker_mock_data_pkey;
ALTER TABLE IF EXISTS ONLY public.digilocker_mock_data DROP CONSTRAINT IF EXISTS digilocker_mock_data_phone_number_key;
ALTER TABLE IF EXISTS ONLY public.candidates DROP CONSTRAINT IF EXISTS candidates_pkey;
ALTER TABLE IF EXISTS ONLY public.candidates DROP CONSTRAINT IF EXISTS candidates_election_id_candidate_id_assembly_id_parliamenta_key;
ALTER TABLE IF EXISTS public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.eci_admin_data ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.digilocker_mock_data ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.candidates ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.users_id_seq;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.elections;
DROP SEQUENCE IF EXISTS public.eci_admin_data_id_seq;
DROP TABLE IF EXISTS public.eci_admin_data;
DROP SEQUENCE IF EXISTS public.digilocker_mock_data_id_seq;
DROP TABLE IF EXISTS public.digilocker_mock_data;
DROP SEQUENCE IF EXISTS public.candidates_id_seq;
DROP TABLE IF EXISTS public.candidates;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: candidates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.candidates (
    id integer NOT NULL,
    election_id character varying NOT NULL,
    candidate_id integer NOT NULL,
    candidate_name text NOT NULL,
    assembly_id text,
    parliamentary_id text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: candidates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.candidates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: candidates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

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
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: digilocker_mock_data_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.digilocker_mock_data_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: digilocker_mock_data_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

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
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: eci_admin_data_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.eci_admin_data_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: eci_admin_data_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.eci_admin_data_id_seq OWNED BY public.eci_admin_data.id;


--
-- Name: elections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.elections (
    election_id character varying NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    start_time timestamp without time zone NOT NULL,
    end_time timestamp without time zone NOT NULL,
    enabled_states text[],
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
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
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_login timestamp without time zone
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: candidates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidates ALTER COLUMN id SET DEFAULT nextval('public.candidates_id_seq'::regclass);


--
-- Name: digilocker_mock_data id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.digilocker_mock_data ALTER COLUMN id SET DEFAULT nextval('public.digilocker_mock_data_id_seq'::regclass);


--
-- Name: eci_admin_data id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eci_admin_data ALTER COLUMN id SET DEFAULT nextval('public.eci_admin_data_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: candidates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.candidates (id, election_id, candidate_id, candidate_name, assembly_id, parliamentary_id, created_at) FROM stdin;
\.


--
-- Data for Name: digilocker_mock_data; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.digilocker_mock_data (id, phone_number, uid, dob, full_name, created_at) FROM stdin;
1	9876543210	123456789012	1990-05-15	Rajesh Kumar	2025-09-24 11:29:17.358453
2	9876543211	123456789013	1985-12-03	Priya Sharma	2025-09-24 11:29:17.358453
3	9876543212	123456789014	1992-08-22	Amit Patel	2025-09-24 11:29:17.358453
4	9876543213	123456789015	1988-03-10	Sneha Gupta	2025-09-24 11:29:17.358453
5	9876543214	123456789016	1995-11-28	Vikram Singh	2025-09-24 11:29:17.358453
6	9876543215	123456789017	1983-07-14	Anita Verma	2025-09-24 11:29:17.358453
7	9876543216	123456789018	1991-01-05	Rohit Jain	2025-09-24 11:29:17.358453
8	9876543217	987654321019	1987-09-18	Kavya Reddy	2025-09-24 11:29:17.358453
9	9876543218	123456789020	1993-04-12	Arjun Agarwal	2025-09-24 11:29:17.358453
10	9876543219	123456789021	1989-06-25	Pooja Nair	2025-09-24 11:29:17.358453
11	9876543220	987654321022	2010-03-15	Young User	2025-09-24 11:29:17.358453
12	9876543221	987654321023	2008-08-10	Minor User	2025-09-24 11:29:17.358453
\.


--
-- Data for Name: eci_admin_data; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.eci_admin_data (id, uid_hash, ac_name, pc_name, ward_number, enc_private_key, wallet_address, created_at, updated_at) FROM stdin;
1	2a33349e7e606a8ad2e30e3c84521f9377450cf09083e162e0a9b1480ce0f972	AC 1	PC 1	Ward 001	\N	\N	2025-09-24 11:29:17.367329	2025-09-24 11:29:17.367329
2	0e9feee8dd5d0d722ae507aecc216984c603cfb41bbc8f8b2313eef72409cd84	AC 2	PC 2	Ward 002	\N	\N	2025-09-24 11:29:17.367329	2025-09-24 11:29:17.367329
3	d13dda0de247e23cfbb377605fcb7ddc5876feb0126eb336de4d893b173cf96f	AC 3	PC 3	Ward 003	\N	\N	2025-09-24 11:29:17.367329	2025-09-24 11:29:17.367329
4	7848e7a32014f3c78205a1f0d6342148b950b117ab419534ca8d3ba03352f9a5	AC 4	PC 4	Ward 004	\N	\N	2025-09-24 11:29:17.367329	2025-09-24 11:29:17.367329
5	d67e811253d74e16460584e20f31e40ba152243c1f91b14f2efde60a557eef8d	AC 5	PC 5	Ward 005	\N	\N	2025-09-24 11:29:17.367329	2025-09-24 11:29:17.367329
6	a099026be37f1913a6c84ea3ecbf1bc3e95d68c70a4cada95e26e3a6acf268dc	AC 6	PC 6	Ward 006	\N	\N	2025-09-24 11:29:17.367329	2025-09-24 11:29:17.367329
7	0722847621484e139b6f8692bb206c28a6858a6954c9289ce77f0a440aa076cc	AC 7	PC 7	Ward 007	\N	\N	2025-09-24 11:29:17.367329	2025-09-24 11:29:17.367329
8	97c7126630eb7f1280928b7aece2319611b24ecb530501b100ce903ff65151de	AC 8	PC 8	Ward 008	\N	\N	2025-09-24 11:29:17.367329	2025-09-24 11:29:17.367329
9	78a0fd421df008a753c8d7a9fdd8e18b6928d1ee512c2f146574d02485cf2de6	AC 9	PC 9	Ward 009	\N	\N	2025-09-24 11:29:17.367329	2025-09-24 11:29:17.367329
10	259a9728b896a6836eacc1b709351299a553b2b97bbf7eafd0c1940a7264543e	AC 10	PC 10	Ward 010	\N	\N	2025-09-24 11:29:17.367329	2025-09-24 11:29:17.367329
11	67a26cbcd3a82226eeea45b9bd67180a3aee2ca0ce02a58ac38abe641cd29a02	AC 11	PC 11	Ward 011	\N	\N	2025-09-24 11:29:17.367329	2025-09-24 11:29:17.367329
12	77618b8bc873a72d6bf96a5c83a9a4a086e8bf7718f63c4b66afc3cbbc2b0a9f	AC 12	PC 12	Ward 012	\N	\N	2025-09-24 11:29:17.367329	2025-09-24 11:29:17.367329
\.


--
-- Data for Name: elections; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.elections (election_id, name, type, start_time, end_time, enabled_states, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, username, uid_hash, password, created_at, last_login) FROM stdin;
\.


--
-- Name: candidates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.candidates_id_seq', 1, false);


--
-- Name: digilocker_mock_data_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.digilocker_mock_data_id_seq', 12, true);


--
-- Name: eci_admin_data_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.eci_admin_data_id_seq', 12, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 1, false);


--
-- Name: candidates candidates_election_id_candidate_id_assembly_id_parliamenta_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidates
    ADD CONSTRAINT candidates_election_id_candidate_id_assembly_id_parliamenta_key UNIQUE (election_id, candidate_id, assembly_id, parliamentary_id);


--
-- Name: candidates candidates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidates
    ADD CONSTRAINT candidates_pkey PRIMARY KEY (id);


--
-- Name: digilocker_mock_data digilocker_mock_data_phone_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.digilocker_mock_data
    ADD CONSTRAINT digilocker_mock_data_phone_number_key UNIQUE (phone_number);


--
-- Name: digilocker_mock_data digilocker_mock_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.digilocker_mock_data
    ADD CONSTRAINT digilocker_mock_data_pkey PRIMARY KEY (id);


--
-- Name: digilocker_mock_data digilocker_mock_data_uid_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.digilocker_mock_data
    ADD CONSTRAINT digilocker_mock_data_uid_key UNIQUE (uid);


--
-- Name: eci_admin_data eci_admin_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eci_admin_data
    ADD CONSTRAINT eci_admin_data_pkey PRIMARY KEY (id);


--
-- Name: eci_admin_data eci_admin_data_uid_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eci_admin_data
    ADD CONSTRAINT eci_admin_data_uid_hash_key UNIQUE (uid_hash);


--
-- Name: elections elections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.elections
    ADD CONSTRAINT elections_pkey PRIMARY KEY (election_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_uid_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_uid_hash_key UNIQUE (uid_hash);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: candidates candidates_election_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidates
    ADD CONSTRAINT candidates_election_id_fkey FOREIGN KEY (election_id) REFERENCES public.elections(election_id);


--
-- PostgreSQL database dump complete
--

