--
-- PostgreSQL database dump
--

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

SET default_tablespace = '';
SET default_table_access_method = heap;

--
-- Name: eci_admin_data; Type: TABLE; Schema: public;
--
CREATE TABLE public.eci_admin_data (
    id SERIAL PRIMARY KEY,
    uid_hash VARCHAR(64) NOT NULL UNIQUE,
    ac_name VARCHAR(200) NOT NULL,
    pc_name VARCHAR(200) NOT NULL,
    ward_number VARCHAR(50),
    enc_private_key BYTEA,
    wallet_address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE public.eci_admin_data IS 'ECI admin table containing voter constituency and wallet data';
COMMENT ON COLUMN public.eci_admin_data.uid_hash IS 'Hashed Aadhaar UID';
COMMENT ON COLUMN public.eci_admin_data.ac_name IS 'Assembly Constituency name';
COMMENT ON COLUMN public.eci_admin_data.pc_name IS 'Parliament Constituency name';
COMMENT ON COLUMN public.eci_admin_data.ward_number IS 'Ward number';
COMMENT ON COLUMN public.eci_admin_data.enc_private_key IS 'Encrypted private key';
COMMENT ON COLUMN public.eci_admin_data.wallet_address IS 'Blockchain wallet address';

--
-- Name: users; Type: TABLE; Schema: public;
--
CREATE TABLE public.users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    uid_hash VARCHAR(64) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    phone_number VARCHAR(15),
    full_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

COMMENT ON TABLE public.users IS 'User registration data';
COMMENT ON COLUMN public.users.username IS 'Unique username';
COMMENT ON COLUMN public.users.uid_hash IS 'Hashed Aadhaar UID (links to eci_admin_data)';
COMMENT ON COLUMN public.users.password IS 'Hashed password';
COMMENT ON COLUMN public.users.phone_number IS 'Phone number from Digilocker';
COMMENT ON COLUMN public.users.full_name IS 'Full name from Digilocker';

--
-- Name: digilocker_mock_data; Type: TABLE; Schema: public;
--
CREATE TABLE public.digilocker_mock_data (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(15) NOT NULL UNIQUE,
    uid VARCHAR(20) NOT NULL UNIQUE,
    dob DATE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE public.digilocker_mock_data IS 'Mock data table for Digilocker verification testing';

--
-- Name: elections; Type: TABLE; Schema: public;
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
-- Name: candidates; Type: TABLE; Schema: public;
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

CREATE SEQUENCE public.candidates_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.candidates_id_seq OWNED BY public.candidates.id;
ALTER TABLE ONLY public.candidates ALTER COLUMN id SET DEFAULT nextval('public.candidates_id_seq'::regclass);

--
-- Data for Name: digilocker_mock_data; Type: TABLE DATA; Schema: public;
--
COPY public.digilocker_mock_data (phone_number, uid, dob, full_name) FROM stdin;
9876543210	123456789012	1990-05-15	Rajesh Kumar
9876543211	123456789013	1985-12-03	Priya Sharma
9876543212	123456789014	1992-08-22	Amit Patel
9876543213	123456789015	1988-03-10	Sneha Gupta
9876543214	123456789016	1995-11-28	Vikram Singh
9876543215	123456789017	1983-07-14	Anita Verma
9876543216	123456789018	1991-01-05	Rohit Jain
9876543217	123456789019	1987-09-18	Kavya Reddy
9876543218	123456789020	1993-04-12	Arjun Agarwal
9876543219	123456789021	1989-06-25	Pooja Nair
9876543220	987654321022	2010-03-15	Young User
9876543221	987654321023	2008-08-10	Minor User
\.

--
-- Data for Name: eci_admin_data; Type: TABLE DATA; Schema: public;
--
COPY public.eci_admin_data (uid_hash, ac_name, pc_name, ward_number, enc_private_key, wallet_address) FROM stdin;
6b3a55e0261b0304143f805a24944e0c4aa52de9b2d8e33a99f3f7b8f6c07a7e	Sample Assembly Constituency 1	Sample Parliament Constituency 1	Ward 001	\N	\N
9bf31c7ff062936a96d3c8bd1f8f2ff3	Sample Assembly Constituency 2	Sample Parliament Constituency 2	Ward 002	\N	\N
8c6976e5b5410415bde908bd4dee15dfb16fcd17	Sample Assembly Constituency 3	Sample Parliament Constituency 3	Ward 003	\N	\N
03c7c0ace395d80182db07ae2c30f034	Sample Assembly Constituency 4	Sample Parliament Constituency 4	Ward 004	\N	\N
a87ff679a2f3e71d9181a67b7542122c	Sample Assembly Constituency 5	Sample Parliament Constituency 5	Ward 005	\N	\N
e4da3b7fbbce2345d7772b0674a318d5	Sample Assembly Constituency 6	Sample Parliament Constituency 6	Ward 006	\N	\N
1679091c5a880faf6fb5e6087eb1b2dc	Sample Assembly Constituency 7	Sample Parliament Constituency 7	Ward 007	\N	\N
8f14e45fceea167a5a36dedd4bea2543	Sample Assembly Constituency 8	Sample Parliament Constituency 8	Ward 008	\N	\N
c9f0f895fb98ab9159f51fd0297e236d	Sample Assembly Constituency 9	Sample Parliament Constituency 9	Ward 009	\N	\N
45c48cce2e2d7fbdea1afc51c7c6ad26	Sample Assembly Constituency 10	Sample Parliament Constituency 10	Ward 010	\N	\N
d3d9446802a44259755d38e6d163e820	Sample Assembly Constituency 11	Sample Parliament Constituency 11	Ward 011	\N	\N
6512bd43d9caa6e02c990b0a82652dca	Sample Assembly Constituency 12	Sample Parliament Constituency 12	Ward 012	\N	\N
\.

--
-- Name: candidates candidates_election_id_candidate_id_assembly_id_parliamenta_key; Type: CONSTRAINT; Schema: public;
--

ALTER TABLE ONLY public.candidates
    ADD CONSTRAINT candidates_election_id_candidate_id_assembly_id_parliamenta_key UNIQUE (election_id, candidate_id, assembly_id, parliamentary_id);

--
-- Name: candidates candidates_pkey; Type: CONSTRAINT; Schema: public;
--

ALTER TABLE ONLY public.candidates
    ADD CONSTRAINT candidates_pkey PRIMARY KEY (id);

--
-- Name: elections elections_pkey; Type: CONSTRAINT; Schema: public;
--

ALTER TABLE ONLY public.elections
    ADD CONSTRAINT elections_pkey PRIMARY KEY (election_id);

--
-- Name: candidates candidates_election_id_fkey; Type: FK CONSTRAINT; Schema: public;
--

ALTER TABLE ONLY public.candidates
    ADD CONSTRAINT candidates_election_id_fkey FOREIGN KEY (election_id) REFERENCES public.elections(election_id);

--
-- PostgreSQL database dump complete
--
