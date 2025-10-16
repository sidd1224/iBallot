-- backend/dump.sql

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
    party_name text,
    symbol text,
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
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    enabled_constituencies integer[],
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    winner_party_name text, -- <-- ADD THIS LINE
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
COPY public.candidates (id, election_id, candidate_id, candidate_name, party_name, symbol, constituency_id, created_at) FROM stdin;
\.

--
-- Data for Name: digilocker_mock_data; Type: TABLE DATA; Schema: public; Owner: -
--
--
-- Data for Name: digilocker_mock_data; Type: TABLE DATA; Schema: public; Owner: -
--
COPY public.digilocker_mock_data (id, phone_number, uid, dob, full_name, created_at) FROM stdin;
1	9876543210	123456789012	1990-05-15	Rajesh Kumar	'2025-09-24 11:29:17.358453+00'
2	9876543211	123456789013	1985-12-03	Priya Sharma	'2025-09-24 11:29:17.358453+00'
3	9876543212	123456789014	1992-08-22	Amit Patel	'2025-09-24 11:29:17.358453+00'
4	6362213225	912598753753	1998-01-10	BHAVANA H P	'2025-10-15 10:15:00+00'
5	8296104590	446370025697	1998-03-20	BHAVANA N	'2025-10-15 10:15:00+00'
6	8217791017	581268199835	1999-07-14	BHOOMIKA GOWDA H G	'2025-10-15 10:15:00+00'
7	7483013392	702574619130	1997-11-02	CHANDANA M	'2025-10-15 10:15:00+00'
8	8073409663	737335420249	2000-02-25	EKSHA D V	'2025-10-15 10:15:00+00'
9	8310279895	286673897992	1996-09-05	HARINI BHANDARI	'2025-10-15 10:15:00+00'
10	9019431214	597452514229	1994-04-12	MADHURA N M	'2025-10-15 10:15:00+00'
11	9113930812	294309423977	1997-05-22	MANMITHA N K	'2025-10-15 10:15:00+00'
12	7019209737	961181990388	1999-08-30	SHOURYA K G	'2025-10-15 10:15:00+00'
13	8310391815	260452100318	2001-01-15	SOUKHYA K J	'2025-10-15 10:15:00+00'
14	8088672153	769304788497	1998-11-20	SUHAINA G	'2025-10-15 10:15:00+00'
15	9019550604	843627194058	1996-06-01	SUNAINA A G	'2025-10-15 10:15:00+00'
16	6362806635	825125474850	2000-12-18	VAISHNAVI C V	'2025-10-15 10:15:00+00'
17	8431994291	264223047649	1995-02-09	Darshan BC	'2025-10-15 10:15:00+00'
18	8951962686	996527430610	1994-10-28	SOHAN ARYA	'2025-10-15 10:15:00+00'
\.

--
-- Data for Name: eci_admin_data; Type: TABLE DATA; Schema: public; Owner: -
--
--
-- Data for Name: eci_admin_data; Type: TABLE DATA; Schema: public; Owner: -
--
COPY public.eci_admin_data (id, uid_hash, ac_name, pc_name, ward_number, enc_private_key, wallet_address, created_at, updated_at, ac_id, pc_id) FROM stdin;
1	2a33349e7e606a8ad2e30e3c84521f9377450cf09083e162e0a9b1480ce0f972	AC 1	PC 1	Ward 001	\N	\N	'2025-09-24 11:29:17.367329+00'	'2025-09-24 11:29:17.367329+00'	1	1
2	0e9feee8dd5d0d722ae507aecc216984c603cfb41bbc8f8b2313eef72409cd84	AC 2	PC 2	Ward 002	\N	\N	'2025-09-24 11:29:17.367329+00'	'2025-09-24 11:29:17.367329+00'	2	2
3	d13dda0de247e23cfbb377605fcb7ddc5876feb0126eb336de4d893b173cf96f	AC 3	PC 3	Ward 003	\N	\N	'2025-09-24 11:29:17.367329+00'	'2025-09-24 11:29:17.367329+00'	3	3
4	05f89e6a296df1812e0ca007e7acacde649fb1bd49ceff98b2680d2c51b9b3f0	AC 1	PC 1	Ward 004	\N	\N	'2025-10-15 10:15:00+00'	'2025-10-15 10:15:00+00'	1	1
5	fd165cf136eff309a731d51a1cddfca620ee01cedb89fbd3cde8f59de65aa968	AC 2	PC 2	Ward 005	\N	\N	'2025-10-15 10:15:00+00'	'2025-10-15 10:15:00+00'	2	2
6	e8fa8623c644d3ee698d1cda8898f6169107541c3092d12bab768f975e01edc3	AC 3	PC 3	Ward 006	\N	\N	'2025-10-15 10:15:00+00'	'2025-10-15 10:15:00+00'	3	3
7	a775d29829cb62d690562c6ca0203dc76591b67245e7b4dc6d50ef0183c09826	AC 1	PC 1	Ward 007	\N	\N	'2025-10-15 10:15:00+00'	'2025-10-15 10:15:00+00'	1	1
8	4f65ec50da37e9f6aa2b77380f99420d5bc609b3b953e9f69a268f2a5320ddc7	AC 2	PC 2	Ward 008	\N	\N	'2025-10-15 10:15:00+00'	'2025-10-15 10:15:00+00'	2	2
9	76ff32ad6dbc08e167bb052a5b6200e05e92b8db70adf8cf33deb8fcdbdf1d78	AC 3	PC 3	Ward 009	\N	\N	'2025-10-15 10:15:00+00'	'2025-10-15 10:15:00+00'	3	3
10	dc316f8f493acbf092a9409154af67fb7739aaf2ff54589d01ce0e13705a3cde	AC 1	PC 1	Ward 010	\N	\N	'2025-10-15 10:15:00+00'	'2025-10-15 10:15:00+00'	1	1
11	3b1f9b0c8802326d52462623701a4fd473d062e8d3b3b753bdfc357862faec0f	AC 2	PC 2	Ward 011	\N	\N	'2025-10-15 10:15:00+00'	'2025-10-15 10:15:00+00'	2	2
12	1506ff4c00232419405ac25023b5d7dca82c021c5014cf081a8aa226a7cc10a0	AC 3	PC 3	Ward 012	\N	\N	'2025-10-15 10:15:00+00'	'2025-10-15 10:15:00+00'	3	3
13	0a16d8c8a19f526d175143d3edbd694dd4c18078bb681f1c396103a0e0270a2d	AC 1	PC 1	Ward 013	\N	\N	'2025-10-15 10:15:00+00'	'2025-10-15 10:15:00+00'	1	1
14	a293ee30f252d10f0a683341e2e4ba5ac00289c6a45c81e6934c0c5c0a88c24e	AC 2	PC 2	Ward 014	\N	\N	'2025-10-15 10:15:00+00'	'2025-10-15 10:15:00+00'	2	2
15	1d7ef6690a72661fad5ecd09336a194fc77cf605e60024ac9540eaa6a04c6b6f	AC 3	PC 3	Ward 015	\N	\N	'2025-10-15 10:15:00+00'	'2025-10-15 10:15:00+00'	3	3
16	8e407a5c65e51f0c8f69ad42915e14b92f416c9c5e534b037e917eed4609b387	AC 1	PC 1	Ward 016	\N	\N	'2025-10-15 10:15:00+00'	'2025-10-15 10:15:00+00'	1	1
17	1ce08828e61690405af3b653c56ecab33548e6e6f325627d7b52b25056f7d929	AC 2	PC 2	Ward 017	\N	\N	'2025-10-15 10:15:00+00'	'2025-10-15 10:15:00+00'	2	2
18	82476d7e0b9474c4a0a7ceb4f5325389c86ea0da5a7ba4fad472cfeb38bb0316	AC 3	PC 3	Ward 018	\N	\N	'2025-10-15 10:15:00+00'	'2025-10-15 10:15:00+00'	3	3
\.
--
-- Data for Name: elections; Type: TABLE DATA; Schema: public; Owner: -
--
COPY public.elections (election_id, name, type, start_time, end_time, enabled_constituencies, created_at) FROM stdin;
\.

--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--
COPY public.users (id, username, uid_hash, password, created_at, last_login) FROM stdin;
\.

--
-- Sequence SET
--
SELECT pg_catalog.setval('public.candidates_id_seq', 1, false);
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