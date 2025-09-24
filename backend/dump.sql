--
-- PostgreSQL database dump (Option 1: Pre-populated eci_admin_data)
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
-- Table: eci_admin_data
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
-- Table: users
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
-- Table: digilocker_mock_data
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
-- Table: elections
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
-- Table: candidates
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
-- Data for digilocker_mock_data
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
-- Data for eci_admin_data (real SHA-256 uid_hashes pre-populated)
--
COPY public.eci_admin_data (uid_hash, ac_name, pc_name, ward_number, enc_private_key, wallet_address) FROM stdin;
2a33349e7e606a8ad2e30e3c84521f9377450cf09083e162e0a9b1480ce0f972	AC 1	PC 1	Ward 001	\N	\N
0e9feee8dd5d0d722ae507aecc216984c603cfb41bbc8f8b2313eef72409cd84	AC 2	PC 2	Ward 002	\N	\N
d13dda0de247e23cfbb377605fcb7ddc5876feb0126eb336de4d893b173cf96f	AC 3	PC 3	Ward 003	\N	\N
7848e7a32014f3c78205a1f0d6342148b950b117ab419534ca8d3ba03352f9a5	AC 4	PC 4	Ward 004	\N	\N
d67e811253d74e16460584e20f31e40ba152243c1f91b14f2efde60a557eef8d	AC 5	PC 5	Ward 005	\N	\N
a099026be37f1913a6c84ea3ecbf1bc3e95d68c70a4cada95e26e3a6acf268dc	AC 6	PC 6	Ward 006	\N	\N
0722847621484e139b6f8692bb206c28a6858a6954c9289ce77f0a440aa076cc	AC 7	PC 7	Ward 007	\N	\N
97c7126630eb7f1280928b7aece2319611b24ecb530501b100ce903ff65151de	AC 8	PC 8	Ward 008	\N	\N
78a0fd421df008a753c8d7a9fdd8e18b6928d1ee512c2f146574d02485cf2de6	AC 9	PC 9	Ward 009	\N	\N
259a9728b896a6836eacc1b709351299a553b2b97bbf7eafd0c1940a7264543e	AC 10	PC 10	Ward 010	\N	\N
67a26cbcd3a82226eeea45b9bd67180a3aee2ca0ce02a58ac38abe641cd29a02	AC 11	PC 11	Ward 011	\N	\N
77618b8bc873a72d6bf96a5c83a9a4a086e8bf7718f63c4b66afc3cbbc2b0a9f	AC 12	PC 12	Ward 012	\N	\N
\.

--
-- Constraints
--
ALTER TABLE ONLY public.candidates
    ADD CONSTRAINT candidates_election_id_candidate_id_assembly_id_parliamenta_key UNIQUE (election_id, candidate_id, assembly_id, parliamentary_id);

ALTER TABLE ONLY public.candidates
    ADD CONSTRAINT candidates_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.elections
    ADD CONSTRAINT elections_pkey PRIMARY KEY (election_id);

ALTER TABLE ONLY public.candidates
    ADD CONSTRAINT candidates_election_id_fkey FOREIGN KEY (election_id) REFERENCES public.elections(election_id);

--
-- Dump complete
--
