--
-- PostgreSQL database dump
--

\restrict yDjSO5vtgNvNZVEHaf3kjztNuiPzRqv7iytRukL7QkVwbyLBtxlCNHwTNIcYoXK

-- Dumped from database version 15.14
-- Dumped by pg_dump version 15.14

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

--
-- Name: adminpack; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS adminpack WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION adminpack; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION adminpack IS 'administrative functions for PostgreSQL';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: companies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.companies (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.companies OWNER TO postgres;

--
-- Name: companies_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.companies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.companies_id_seq OWNER TO postgres;

--
-- Name: companies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.companies_id_seq OWNED BY public.companies.id;


--
-- Name: generated_reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.generated_reports (
    id integer NOT NULL,
    company_id integer,
    report_text text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.generated_reports OWNER TO postgres;

--
-- Name: generated_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.generated_reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.generated_reports_id_seq OWNER TO postgres;

--
-- Name: generated_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.generated_reports_id_seq OWNED BY public.generated_reports.id;


--
-- Name: report_generation_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.report_generation_logs (
    id integer NOT NULL,
    company_id integer,
    status character varying(50) NOT NULL,
    message text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.report_generation_logs OWNER TO postgres;

--
-- Name: report_generation_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.report_generation_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.report_generation_logs_id_seq OWNER TO postgres;

--
-- Name: report_generation_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.report_generation_logs_id_seq OWNED BY public.report_generation_logs.id;


--
-- Name: valuation_models; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.valuation_models (
    id integer NOT NULL,
    company_id integer,
    dcf character varying(50) NOT NULL,
    cca character varying(50) NOT NULL,
    ptm character varying(50) NOT NULL,
    abv character varying(50) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.valuation_models OWNER TO postgres;

--
-- Name: valuation_models_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.valuation_models_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.valuation_models_id_seq OWNER TO postgres;

--
-- Name: valuation_models_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.valuation_models_id_seq OWNED BY public.valuation_models.id;


--
-- Name: companies id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies ALTER COLUMN id SET DEFAULT nextval('public.companies_id_seq'::regclass);


--
-- Name: generated_reports id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.generated_reports ALTER COLUMN id SET DEFAULT nextval('public.generated_reports_id_seq'::regclass);


--
-- Name: report_generation_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_generation_logs ALTER COLUMN id SET DEFAULT nextval('public.report_generation_logs_id_seq'::regclass);


--
-- Name: valuation_models id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.valuation_models ALTER COLUMN id SET DEFAULT nextval('public.valuation_models_id_seq'::regclass);


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.companies (id, name, description, created_at) FROM stdin;
1	Test Database Company	A company created to test PostgreSQL database integration	2025-09-25 14:26:28.318056
2	Test Company	A technology startup focused on AI solutions	2025-09-25 14:27:10.562756
\.


--
-- Data for Name: generated_reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.generated_reports (id, company_id, report_text, created_at) FROM stdin;
1	1	VALUATION REPORT\n=================\n\nProduced By: Number Leader\nDate: September 25, 2025\n\nABOUT NUMBER LEADER\n------------------\nAt Number Leader, we are more than just an investment bank; we are at the forefront of financial innovation. We specialize in delivering cutting-edge valuation, benchmarking, and market research services by leveraging data, technology, and artificial intelligence.\n\nABOUT TEST DATABASE COMPANY\n---------------------------\nA company created to test PostgreSQL database integration\n\nSERVICE PROVIDED\n----------------\nNumber Leader has been engaged to provide a comprehensive valuation service for Test Database Company.\n\nVALUATION METHODOLOGIES\n=======================\n\nMethod 1: Discounted Cash Flow (DCF)\n----------------------------------\nDescription: The Discounted Cash Flow (DCF) method estimates the value of Test Database Company based on its projected future cash flows, discounted to their present value using an appropriate discount rate.\nValuation: ,000\n\nMethod 2: Comparable Company Analysis (CCA)\n------------------------------------------\nDescription: The Comparable Company Analysis (CCA) method values Test Database Company by comparing it to similar companies in the industry.\nValuation: ,000\n\nMethod 3: Precedent Transaction Method (PTM)\n--------------------------------------------\nDescription: The Precedent Transaction Method (PTM) evaluates Test Database Company based on the purchase prices of similar companies in recent transactions.\nValuation: ,000\n\nMethod 4: Asset-Based Valuation (ABV)\n-------------------------------------\nDescription: The Asset-Based Valuation (ABV) method calculates the value of Test Database Company based on its tangible and intangible assets.\nValuation: ,000\n\nCONCLUSION\n==========\n\nBased on the four valuation methodologies, the estimated value of Test Database Company ranges between ,000 and ,000.\n\nRECOMMENDATIONS\n---------------\n1. The company's growth potential and scalability in its target market.\n2. The strength of its intellectual property and technological assets.\n3. Market trends and investor sentiment in the industry.\n\nDISCLAIMER\n----------\nThis report is intended solely for the use of Test Database Company and its authorized representatives. The valuations provided are based on the information available at the time of analysis and are subject to change based on market conditions, additional data, or other factors.\n\nPrepared by Number Leader\nBENGALURU, INDIA\ninfo@numberleader.com\n	2025-09-25 14:26:28.318056
2	2	VALUATION REPORT\n=================\n\nProduced By: Number Leader\nDate: September 25, 2025\n\nABOUT NUMBER LEADER\n------------------\nAt Number Leader, we are more than just an investment bank; we are at the forefront of financial innovation. We specialize in delivering cutting-edge valuation, benchmarking, and market research services by leveraging data, technology, and artificial intelligence.\n\nABOUT TEST COMPANY\n------------------\nA technology startup focused on AI solutions\n\nSERVICE PROVIDED\n----------------\nNumber Leader has been engaged to provide a comprehensive valuation service for Test Company.\n\nVALUATION METHODOLOGIES\n=======================\n\nMethod 1: Discounted Cash Flow (DCF)\n----------------------------------\nDescription: The Discounted Cash Flow (DCF) method estimates the value of Test Company based on its projected future cash flows, discounted to their present value using an appropriate discount rate.\nValuation: $10M\n\nMethod 2: Comparable Company Analysis (CCA)\n------------------------------------------\nDescription: The Comparable Company Analysis (CCA) method values Test Company by comparing it to similar companies in the industry.\nValuation: $12M\n\nMethod 3: Precedent Transaction Method (PTM)\n--------------------------------------------\nDescription: The Precedent Transaction Method (PTM) evaluates Test Company based on the purchase prices of similar companies in recent transactions.\nValuation: $9M\n\nMethod 4: Asset-Based Valuation (ABV)\n-------------------------------------\nDescription: The Asset-Based Valuation (ABV) method calculates the value of Test Company based on its tangible and intangible assets.\nValuation: $11M\n\nCONCLUSION\n==========\n\nBased on the four valuation methodologies, the estimated value of Test Company ranges between $9M and $11M.\n\nRECOMMENDATIONS\n---------------\n1. The company's growth potential and scalability in its target market.\n2. The strength of its intellectual property and technological assets.\n3. Market trends and investor sentiment in the industry.\n\nDISCLAIMER\n----------\nThis report is intended solely for the use of Test Company and its authorized representatives. The valuations provided are based on the information available at the time of analysis and are subject to change based on market conditions, additional data, or other factors.\n\nPrepared by Number Leader\nBENGALURU, INDIA\ninfo@numberleader.com\n	2025-09-25 14:27:10.562756
\.


--
-- Data for Name: report_generation_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.report_generation_logs (id, company_id, status, message, created_at) FROM stdin;
1	1	STARTED	Report generation started	2025-09-25 14:26:28.318056
2	1	COMPLETED	Report generated successfully	2025-09-25 14:26:28.318056
3	2	STARTED	Report generation started	2025-09-25 14:27:10.562756
4	2	COMPLETED	Report generated successfully	2025-09-25 14:27:10.562756
\.


--
-- Data for Name: valuation_models; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.valuation_models (id, company_id, dcf, cca, ptm, abv, created_at) FROM stdin;
1	1	,000	,000	,000	,000	2025-09-25 14:26:28.318056
2	2	$10M	$12M	$9M	$11M	2025-09-25 14:27:10.562756
\.


--
-- Name: companies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.companies_id_seq', 2, true);


--
-- Name: generated_reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.generated_reports_id_seq', 2, true);


--
-- Name: report_generation_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.report_generation_logs_id_seq', 4, true);


--
-- Name: valuation_models_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.valuation_models_id_seq', 2, true);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: generated_reports generated_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.generated_reports
    ADD CONSTRAINT generated_reports_pkey PRIMARY KEY (id);


--
-- Name: report_generation_logs report_generation_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_generation_logs
    ADD CONSTRAINT report_generation_logs_pkey PRIMARY KEY (id);


--
-- Name: valuation_models valuation_models_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.valuation_models
    ADD CONSTRAINT valuation_models_pkey PRIMARY KEY (id);


--
-- Name: generated_reports generated_reports_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.generated_reports
    ADD CONSTRAINT generated_reports_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: report_generation_logs report_generation_logs_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_generation_logs
    ADD CONSTRAINT report_generation_logs_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: valuation_models valuation_models_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.valuation_models
    ADD CONSTRAINT valuation_models_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- PostgreSQL database dump complete
--

\unrestrict yDjSO5vtgNvNZVEHaf3kjztNuiPzRqv7iytRukL7QkVwbyLBtxlCNHwTNIcYoXK

