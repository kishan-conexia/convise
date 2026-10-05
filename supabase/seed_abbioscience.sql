-- ============================================================================
-- AB BIOSCIENCE PVT. LTD. - INITIAL SEED DATA
-- Target: Supabase Instance (Abbioscience-Convise)
-- Scope: departments, positions, leave_types, leave_allocation_rules, user_app_config
-- Domain: Industrial Biotechnology, Grain-Based Distilleries, Fermentation,
--         Enzyme Systems, Process Chemicals, and Animal Nutrition.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. DEPARTMENTS
-- ============================================================================
-- Preserves standard Corporate Services (30, 301, 302, 303) essential for
-- Convise RLS policies (is_manager_of_administration, is_manager_of_specific_departments).
-- ============================================================================

INSERT INTO public.departments (
    id, name, code, description, parent_id, level, path, manager_id,
    department_type, service_area, shift_type, cost_center, annual_budget,
    max_headcount, is_active, effective_from
) VALUES
-- Level 1: Executive Management
(
    1,
    'Executive Leadership & MD Office',
    'EXEC',
    'Corporate governance, strategic scientific direction, and overall management of AB Bioscience Pvt. Ltd.',
    NULL,
    1,
    'EXEC',
    NULL,
    'executive',
    'Corporate HQ - Gurgaon',
    'business_hours',
    'CC_EXEC_001',
    5000000.00,
    3,
    true,
    CURRENT_DATE
),

-- Level 2: Research & Development
(
    10,
    'Research & Development',
    'RD',
    'Biocatalysts engineering, formulation development, enzyme screening, and fermentation technology innovation',
    1,
    2,
    'EXEC.RD',
    NULL,
    'technical',
    'R&D Laboratory - Gurgaon',
    'business_hours',
    'CC_RD_001',
    8000000.00,
    10,
    true,
    CURRENT_DATE
),

-- Level 3: R&D Sub-units
(
    101,
    'Enzyme Formulation & Biocatalysts',
    'RD_ENZYME',
    'High-activity liquefaction and saccharification biocatalyst formulations (thermostable alpha-amylases and glucoamylases)',
    10,
    3,
    'EXEC.RD.RD_ENZYME',
    NULL,
    'technical',
    'Enzyme Research Lab',
    'business_hours',
    'CC_RD_ENZ_001',
    4000000.00,
    5,
    true,
    CURRENT_DATE
),
(
    102,
    'Fermentation & Microbial Solutions',
    'RD_FERM',
    'Active dry yeast optimization, microbial contamination control (antimicrobials), and high-gravity fermentation trials',
    10,
    3,
    'EXEC.RD.RD_FERM',
    NULL,
    'technical',
    'Fermentation Pilot Facility',
    'business_hours',
    'CC_RD_FERM_001',
    3500000.00,
    5,
    true,
    CURRENT_DATE
),

-- Level 2: Business Operations
(
    20,
    'Business Operations',
    'BIZ_OPS',
    'Corporate operations, sales, commercial administration, and shared business services',
    1,
    2,
    'EXEC.BIZ_OPS',
    NULL,
    'operational',
    'All Regions',
    'business_hours',
    'CC_BIZ_001',
    15000000.00,
    1,
    true,
    '2025-06-04'
),

-- Level 2 / 3: Corporate Services & Sub-departments (Standard Convise Core)
(
    30,
    'Corporate Services',
    'CORP_SVC',
    'Finance, HR, legal, and administrative support',
    20,
    2,
    'EXEC.BIZ_OPS.CORP_SVC',
    NULL,
    'support',
    'All Regions',
    'business_hours',
    'CC_CORP_001',
    8000000.00,
    1,
    true,
    '2025-06-04'
),
(
    301,
    'Human Resources',
    'HR',
    'HR operations and talent management',
    30,
    3,
    'EXEC.BIZ_OPS.CORP_SVC.HR',
    NULL,
    'support',
    'Head Office',
    'business_hours',
    'CC_HR_001',
    2000000.00,
    1,
    true,
    '2025-06-04'
),
(
    302,
    'Finance & Accounts',
    'FINANCE',
    'Financial management and accounting',
    30,
    3,
    'EXEC.BIZ_OPS.CORP_SVC.FINANCE',
    (SELECT id FROM public.profiles WHERE id = '8e1dce71-ef51-40f0-aabf-5e37c14f8f6f'::uuid),
    'support',
    'Head Office',
    'business_hours',
    'CC_FIN_001',
    3000000.00,
    2,
    true,
    '2025-06-04'
),
(
    303,
    'Administration',
    'ADMIN',
    'General administration and facilities',
    30,
    3,
    'EXEC.BIZ_OPS.CORP_SVC.ADMIN',
    (SELECT id FROM public.profiles WHERE id = '36b525a4-087d-4536-b182-21a1cb77d2cb'::uuid),
    'support',
    'All Locations',
    'business_hours',
    'CC_ADMIN_001',
    1500000.00,
    5,
    true,
    '2025-06-04'
),

-- Level 2: Commercial & Industrial Sales
(
    40,
    'Commercial & Industrial Sales',
    'SALES',
    'B2B sales of high-performance enzyme formulations, biocatalysts, active yeast, and water process chemicals',
    20,
    2,
    'EXEC.BIZ_OPS.SALES',
    NULL,
    'customer_facing',
    'Pan India & Global Clients',
    'business_hours',
    'CC_SALES_001',
    12000000.00,
    15,
    true,
    CURRENT_DATE
),

-- Level 3: Sales Sub-units
(
    401,
    'Distillery & Sugar Industry Sales',
    'SALES_DISTILLERY',
    'Client acquisition and key account management across grain distilleries, ethanol plants, and sugar complexes',
    40,
    3,
    'EXEC.BIZ_OPS.SALES.SALES_DISTILLERY',
    NULL,
    'customer_facing',
    'Major Distillery Belts (North, West, South)',
    'business_hours',
    'CC_SALES_DIST_001',
    6000000.00,
    8,
    true,
    CURRENT_DATE
),
(
    402,
    'Animal Nutrition & Feed Enzymes Sales',
    'SALES_NUTRITION',
    'B2B sales of animal feed biocatalysts, DDGS quality enhancers (AB Colour Pro), and nutritional process aids',
    40,
    3,
    'EXEC.BIZ_OPS.SALES.SALES_NUTRITION',
    NULL,
    'customer_facing',
    'Feed Mills & Livestock Sector',
    'business_hours',
    'CC_SALES_NUT_001',
    3500000.00,
    4,
    true,
    CURRENT_DATE
),
(
    403,
    'Key Accounts & Institutional Business',
    'SALES_INST',
    'Large corporate distillery conglomerates, long-term rate contracts, government/sugar federation tenders, and exports',
    40,
    3,
    'EXEC.BIZ_OPS.SALES.SALES_INST',
    NULL,
    'customer_facing',
    'Corporate & International Markets',
    'business_hours',
    'CC_SALES_INST_001',
    4000000.00,
    3,
    true,
    CURRENT_DATE
),

-- Level 2: Supply Chain & Logistics
(
    50,
    'Supply Chain & Logistics',
    'SCM',
    'Biomolecule warehousing, temperature-controlled cold chain logistics, raw material procurement, and dispatch operations',
    20,
    2,
    'EXEC.BIZ_OPS.SCM',
    NULL,
    'operational',
    'Warehouse & Freight Logistics',
    'business_hours',
    'CC_SCM_001',
    6000000.00,
    8,
    true,
    CURRENT_DATE
),

-- Level 3: SCM Sub-units
(
    501,
    'Warehouse & Cold Storage Operations',
    'WH_STORAGE',
    'Gurgaon biomolecule storage facility, temperature loggers, stock rotation (FIFO), batch packaging, and hazardous goods handling',
    50,
    3,
    'EXEC.BIZ_OPS.SCM.WH_STORAGE',
    NULL,
    'operational',
    'Gurgaon Biomolecule Warehouse',
    'rotating_shifts',
    'CC_WH_001',
    3500000.00,
    5,
    true,
    CURRENT_DATE
),
(
    502,
    'Logistics & Dispatch Coordination',
    'LOG_DISPATCH',
    'Reefer carrier booking, freight dispatch, E-way bill generation, real-time shipment tracking, and plant delivery confirmation',
    50,
    3,
    'EXEC.BIZ_OPS.SCM.LOG_DISPATCH',
    NULL,
    'operational',
    'National Transport Logistics',
    'business_hours',
    'CC_LOG_001',
    2500000.00,
    4,
    true,
    CURRENT_DATE
),

-- Level 2: Technical Services & Process Applications
(
    60,
    'Technical Services & Process Applications',
    'TECH_SERVICES',
    'On-site distillery technical trials, plant commissioning, fermentation troubleshooting, and process optimization',
    1,
    2,
    'EXEC.TECH_SERVICES',
    NULL,
    'customer_facing',
    'Pan India - Client Plants',
    'field_work',
    'CC_TECH_SVC_001',
    7000000.00,
    12,
    true,
    CURRENT_DATE
),

-- Level 3: Technical Services Sub-units
(
    601,
    'Distillery & Fermentation Field Support',
    'FIELD_DISTILLERY',
    'Grain milling optimization, starch conversion, liquefaction/saccharification trials, yeast propagation, and yield audits',
    60,
    3,
    'EXEC.TECH_SERVICES.FIELD_DISTILLERY',
    NULL,
    'technical',
    'Grain & Molasses Distilleries',
    'field_work',
    'CC_FIELD_DIST_001',
    4500000.00,
    8,
    true,
    CURRENT_DATE
),
(
    602,
    'Water & Process Chemicals Technical Support',
    'FIELD_CHEM',
    'Boiler & cooling water treatment programs, anti-scalant dosing, sugar mill process chemicals, and plant utility audits',
    60,
    3,
    'EXEC.TECH_SERVICES.FIELD_CHEM',
    NULL,
    'technical',
    'Industrial Utilities & Sugar Mills',
    'field_work',
    'CC_FIELD_CHEM_001',
    2500000.00,
    4,
    true,
    CURRENT_DATE
),

-- Level 2: Quality Assurance & Regulatory Affairs
(
    70,
    'Quality Assurance & Regulatory Affairs',
    'QA_QC',
    'Total quality management, ISO/GLP certification, FSSAI compliance, TDS/MSDS documentation, and batch verification',
    1,
    2,
    'EXEC.QA_QC',
    NULL,
    'technical',
    'Central Testing Facility',
    'business_hours',
    'CC_QA_001',
    4500000.00,
    8,
    true,
    CURRENT_DATE
),

-- Level 3: QA/QC Sub-units
(
    701,
    'Quality Control & Analytical Lab',
    'QC_LAB',
    'Analytical enzyme activity assays, raw material testing, finished goods release, and Certificate of Analysis (CoA) issuance',
    70,
    3,
    'EXEC.QA_QC.QC_LAB',
    NULL,
    'technical',
    'Analytical & Microbial Lab',
    'rotating_shifts',
    'CC_QC_LAB_001',
    2500000.00,
    5,
    true,
    CURRENT_DATE
),
(
    702,
    'Regulatory Compliance & Documentation',
    'REG_DOC',
    'Technical Data Sheets (TDS), Material Safety Data Sheets (MSDS), FSSAI licensing, and export regulatory compliance',
    70,
    3,
    'EXEC.QA_QC.REG_DOC',
    NULL,
    'support',
    'Corporate Office - Gurgaon',
    'business_hours',
    'CC_REG_001',
    1500000.00,
    3,
    true,
    CURRENT_DATE
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    code = EXCLUDED.code,
    description = EXCLUDED.description,
    parent_id = EXCLUDED.parent_id,
    level = EXCLUDED.level,
    path = EXCLUDED.path,
    department_type = EXCLUDED.department_type,
    service_area = EXCLUDED.service_area,
    shift_type = EXCLUDED.shift_type,
    cost_center = EXCLUDED.cost_center,
    annual_budget = EXCLUDED.annual_budget,
    max_headcount = EXCLUDED.max_headcount,
    is_active = EXCLUDED.is_active;

-- Advance sequence to prevent primary key collisions when adding units via UI
SELECT setval(pg_get_serial_sequence('public.departments', 'id'), COALESCE((SELECT MAX(id) FROM public.departments), 1));


-- ============================================================================
-- 2. POSITIONS / DESIGNATIONS
-- ============================================================================
-- Cleanly mapped to department IDs:
-- 1: MD Office | 10, 101, 102: R&D | 301, 302, 303: Corporate Services
-- 40, 401-403: Sales | 50, 501-502: SCM | 60, 601-602: Tech Services | 70, 701-702: QA/QC
-- ============================================================================

INSERT INTO public.positions (
    id, designation, main_department_id, code, description, job_family,
    is_active, min_salary, max_salary, requirements, responsibilities, level
) VALUES
-- Executive Leadership
(
    1,
    'Managing Director & CEO',
    1,
    'MD_CEO',
    'Executive leadership, strategic direction, and commercial growth of AB Bioscience Pvt. Ltd.',
    'Executive Leadership',
    true,
    2800000,
    4500000,
    '["Post Graduate / Ph.D in Microbiology or Biotechnology", "20+ years industrial experience in distilleries, ethanol, and fermentation", "Visionary business leadership and customer partnership expertise"]'::jsonb,
    '["Steering company strategy and technological vision", "Directing corporate growth, partnerships, and high-value distillery alliances", "Leading board governance and statutory compliance", "Overseeing P&L performance across all business units"]'::jsonb,
    'Chief Executive'
),

-- R&D Leadership & Scientists
(
    10,
    'Principal Scientist / Head of R&D',
    10,
    'RD_HEAD',
    'Directs biocatalyst discovery, enzyme formulation research, and pilot-scale fermentation optimization',
    'R&D & Science',
    true,
    1800000,
    2600000,
    '["Ph.D in Microbiology, Biochemistry, or Biotechnology", "12+ years R&D experience in industrial enzymes and bio-fermentation", "Demonstrated patent / formulation development track record"]'::jsonb,
    '["Leading the enzyme formulation research pipeline", "Directing thermostability and starch-liquefaction assay methodologies", "Translating customer process requirements into tailored enzyme products", "Mentoring scientists and laboratory associates"]'::jsonb,
    'Director'
),
(
    101,
    'Senior Formulation Scientist',
    101,
    'SR_FORM_SCI',
    'Formulation development of alpha-amylases, glucoamylases, and protease blends for grain mash liquefaction',
    'R&D & Science',
    true,
    850000,
    1300000,
    '["M.Sc / Ph.D in Biochemistry or Biotechnology", "5+ years experience in enzyme chemistry and stability optimization", "Expertise in viscosity reduction and high-temperature enzyme kinetics"]'::jsonb,
    '["Developing high-activity liquid and powder enzyme formulations", "Performing shelf-life stability and temperature tolerance studies", "Conducting comparative bench trials against global industry benchmarks", "Documenting formulation recipes and batch production guidelines"]'::jsonb,
    'Senior Executive'
),
(
    102,
    'Enzyme Formulation Chemist',
    101,
    'ENZ_CHEM',
    'Conducts day-to-day enzymatic assays, enzyme activity unit quantification, and formulation trials',
    'R&D & Science',
    true,
    450000,
    700000,
    '["M.Sc in Chemistry, Biochemistry, or Allied Sciences", "2-4 years analytical laboratory experience", "Proficiency in spectrophotometry and enzyme assays"]'::jsonb,
    '["Executing enzymatic assay protocols (DU, AGU, GAU units)", "Testing raw enzyme concentrates and stabilizer compounds", "Maintaining lab batch records and analytical equipment calibration", "Supporting scale-up trials from bench to blending plant"]'::jsonb,
    'Executive'
),
(
    103,
    'Senior Fermentation Microbiologist',
    102,
    'SR_FERM_MICRO',
    'Leads microbial fermentation studies, yeast vitality enhancement, and anti-contamination screening',
    'R&D & Science',
    true,
    800000,
    1250000,
    '["M.Sc / Ph.D in Industrial Microbiology or Biotechnology", "5+ years experience in yeast cultivation and distillery fermenter dynamics", "Deep knowledge of high gravity mash and osmotic stress"]'::jsonb,
    '["Evaluating yeast strains under elevated temperature and ethanol concentrations", "Screening antimicrobial agents (Ferm GSP) against bacterial infections", "Optimizing fermentation nutrient formulations and boosters", "Publishing application guidelines for distillery technical field teams"]'::jsonb,
    'Senior Executive'
),
(
    104,
    'Fermentation Research Associate',
    102,
    'FERM_RES_ASSOC',
    'Executes pilot fermenter runs, analyzes alcohol yield, and monitors yeast cell viability',
    'R&D & Science',
    true,
    380000,
    600000,
    '["B.Sc / M.Sc in Microbiology or Biotechnology", "1-3 years fermentation or brewery/distillery lab experience", "Familiarity with hemocytometer cell counts and Brix/pH tracking"]'::jsonb,
    '["Running benchtop fermenters under varied grain mash conditions", "Logging fermentation progression, residual sugars, and alcohol percentages", "Preparing microbial media and culture preservation stocks", "Assisting in troubleshooting contamination incidents"]'::jsonb,
    'Junior'
),
(
    105,
    'R&D Laboratory Intern',
    10,
    'RD_INTERN',
    'Learning laboratory practices, shadowing senior scientists, and assisting in basic sample preparation',
    'R&D & Science',
    true,
    120000,
    180000,
    '["Student or recent graduate in Biotechnology, Microbiology, or Chemistry", "Strong foundational scientific curiosity and lab safety adherence", "Basic computer and data logging skills"]'::jsonb,
    '["Assisting with lab glassware sterilization and preparation", "Observing assay protocols and recording experimental measurements", "Learning enzyme handling and cold storage procedures", "Maintaining clean lab environment in compliance with GLP"]'::jsonb,
    'Intern'
),

-- Corporate Services: Human Resources (Dept 301)
(
    301,
    'HR & Talent Acquisition Manager',
    301,
    'HR_MGR',
    'Oversees talent acquisition, employee lifecycle, payroll processing, statutory labor compliance, and HR strategy',
    'Human Resources',
    true,
    900000,
    1400000,
    '["MBA in Human Resources", "7-10 years HR generalist experience in life sciences, chemical, or manufacturing sector", "Expertise in Indian labor laws, PF, ESI, gratuity, and performance appraisal systems"]'::jsonb,
    '["Designing hiring strategies for scientific, technical service, and industrial sales roles", "Administering monthly payroll, attendance, leave records, and statutory deductions", "Driving employee engagement, annual performance reviews, and retention programs", "Managing corporate HR policies and employee relations"]'::jsonb,
    'Manager'
),
(
    302,
    'HR & Talent Acquisition Executive',
    301,
    'HR_TA_EXE',
    'Coordinates recruitment for R&D, technical field, and sales teams, employee onboarding, and HR records',
    'Human Resources',
    true,
    380000,
    600000,
    '["MBA HR / BBA with 2-4 years recruitment and HR operations experience", "Good sourcing skills across LinkedIn and job portals for technical/science profiles"]'::jsonb,
    '["Sourcing, screening, and scheduling interviews for specialized biotech and sales positions", "Conducting new hire orientation, joining documentation, and background verification", "Managing employee leave records, attendance logs, and HR portal updates", "Organizing employee engagement events and festival celebrations"]'::jsonb,
    'Executive'
),

-- Corporate Services: Finance & Accounts (Dept 302)
(
    320,
    'Finance & Accounts Manager',
    302,
    'FIN_MGR',
    'Leads financial planning, accounts finalization, GST/TDS compliance, debtor aging, and annual statutory audits',
    'Finance & Accounts',
    true,
    1000000,
    1550000,
    '["CA / CMA / MBA Finance", "7-10 years corporate accounting experience in manufacturing or B2B trading", "Expert in Tally/ERP, GST laws, Income Tax, banking, and working capital"]'::jsonb,
    '["Managing financial books, monthly P&L statements, and balance sheet finalization", "Ensuring timely statutory compliance: GST returns, TDS deposits, and advance tax", "Monitoring client receivables and enforcing credit period policies", "Managing banking relationships, credit lines, and foreign exchange/trade documentation"]'::jsonb,
    'Manager'
),
(
    321,
    'Senior Accounts Executive',
    302,
    'SR_ACC_EXE',
    'Handles customer billing, debtor reconciliations, vendor payments, and monthly tax return preparations',
    'Finance & Accounts',
    true,
    480000,
    750000,
    '["M.Com / Inter CA with 3-5 years corporate accounts experience", "Thorough hands-on experience in Tally Prime / ERP, GST, and MS Excel"]'::jsonb,
    '["Processing sales invoices and verifying tax rates, HSN codes, and discount approvals", "Reconciling bank accounts and vendor/customer ledgers monthly", "Filing monthly GST returns (GSTR-1, GSTR-3B) and issuing TDS certificates", "Assisting during internal and statutory audits with ledger schedules"]'::jsonb,
    'Senior Executive'
),
(
    322,
    'Accounts & Billing Executive',
    302,
    'ACC_BILLING_EXE',
    'Generates daily sales invoices, records payment receipts, maintains vendor vouchers, and petty cash',
    'Finance & Accounts',
    true,
    280000,
    420000,
    '["B.Com with 1-3 years accounting experience", "Proficiency in basic accounting entries, Tally, and Excel"]'::jsonb,
    '["Creating sales invoices in ERP upon receipt of dispatch confirmation", "Entering vendor purchase bills and expense vouchers", "Recording incoming NEFT/RTGS customer payments against outstanding bills", "Maintaining organized physical and digital archives of all accounting vouchers"]'::jsonb,
    'Junior'
),

-- Corporate Services: Administration (Dept 303)
(
    330,
    'Front Office & Admin Executive',
    303,
    'ADMIN_EXE',
    'Manages front office, executive travel itineraries for technical field staff, courier dispatch, and office supplies',
    'Administration',
    true,
    240000,
    360000,
    '["Graduate with 1-3 years front office or administrative coordination experience", "Pleasant personality, courteous telephone manners, and organized approach"]'::jsonb,
    '["Receiving guests, clients, and visitors at Gurgaon corporate office", "Booking flights, hotels, and local transit for technical application field teams", "Coordinating office stationery, pantry supplies, and housekeeping maintenance", "Managing incoming/outgoing couriers, sample dispatches, and postal records"]'::jsonb,
    'Junior'
),
(
    331,
    'Facilities & Office Coordinator',
    303,
    'ADMIN_COORD',
    'Coordinates building maintenance, office asset inventory, vendor contracts, and facility security',
    'Administration',
    true,
    300000,
    450000,
    '["Graduate with 2-4 years administrative facilities experience", "Hands-on vendor coordination and office management capability"]'::jsonb,
    '["Liaising with building management at The Hive by Satya Group, Gurgaon", "Overseeing maintenance AMC contracts for air conditioning, power backup, and IT", "Managing office asset registers and procurement of administrative equipment", "Ensuring general workplace hygiene, safety protocols, and visitor logs"]'::jsonb,
    'Executive'
),

-- Commercial & Industrial Sales (Dept 40, 401, 402, 403)
(
    401,
    'Vice President - Commercial Sales',
    40,
    'VP_SALES',
    'Oversees national commercial business development, revenue targets, and key account strategies across all verticals',
    'Commercial & Sales',
    true,
    2000000,
    3200000,
    '["MBA with Science or Chemical/Biotech background", "12+ years B2B sales leadership in enzymes, distillery chemicals, or bio-process inputs", "Established C-level network across major distillery and sugar groups"]'::jsonb,
    '["Formulating sales growth strategy and setting annual revenue targets", "Negotiating high-value annual supply agreements with top distillery conglomerates", "Leading the national sales team and mentoring regional sales managers", "Monitoring market pricing, competitor moves, and emerging ethanol capacity trends"]'::jsonb,
    'Director'
),
(
    402,
    'Regional Sales Manager - Distilleries',
    401,
    'RSM_DIST',
    'Manages commercial sales, client accounts, and revenue quotas across grain and molasses distilleries in the region',
    'Commercial & Sales',
    true,
    1100000,
    1600000,
    '["MBA / Graduate with 7-10 years B2B industrial sales experience in distilleries or sugar industry", "Strong track record of achieving multi-crore annual sales targets", "Excellent negotiation, presentation, and relationship building skills"]'::jsonb,
    '["Driving sales of ArrowLiq, ArrowSac, Active Dry Yeast, and fermentation boosters", "Managing regional distributor network and client credit parameters", "Identifying new grain distillery projects and securing initial trial orders", "Forecasting monthly demand and coordinating timely deliveries with supply chain"]'::jsonb,
    'Manager'
),
(
    403,
    'Key Account Executive - Sugar & Distilling',
    401,
    'KAE_SUGAR_DIST',
    'Maintains active client relationships, processes repeat orders, and generates new accounts in assigned distillery territory',
    'Commercial & Sales',
    true,
    480000,
    750000,
    '["Graduate in Science, Commerce, or Management", "2-5 years B2B sales experience in process industry or chemical inputs", "Self-motivated, proactive communicator with strong CRM discipline"]'::jsonb,
    '["Visiting distillery plant purchase heads and technical directors regularly", "Generating formal commercial quotations and follow-up on order closures", "Securing repeat purchase orders for liquefaction/saccharification enzymes", "Tracking payment receivables and resolving commercial customer queries"]'::jsonb,
    'Executive'
),
(
    404,
    'Business Development Manager - Animal Nutrition',
    402,
    'BDM_ANIMAL_NUT',
    'Expands commercial presence in feed enzymes, animal nutrition additives, and DDGS quality enhancers',
    'Commercial & Sales',
    true,
    900000,
    1400000,
    '["B.V.Sc / B.Sc Agriculture / Biotech / MBA", "5-8 years experience in animal feed additives or animal health B2B sales", "Deep relationships with commercial poultry and livestock feed formulators"]'::jsonb,
    '["Driving adoption of AB Colour Pro (DDGS enhancer) and animal feed enzymes", "Establishing distribution partnerships with major cattle and poultry feed mills", "Demonstrating Feed Conversion Ratio (FCR) and nutritional yield benefits", "Achieving quarterly sales targets for the animal nutrition vertical"]'::jsonb,
    'Manager'
),
(
    405,
    'Institutional & Key Accounts Manager',
    403,
    'INST_ACCT_MGR',
    'Handles large corporate ethanol manufacturers, long-term corporate supply agreements, and export inquiries',
    'Commercial & Sales',
    true,
    1200000,
    1800000,
    '["MBA in Marketing / International Business", "8+ years managing corporate institutional accounts or export trade", "Strong understanding of international trade, letters of credit, and contract law"]'::jsonb,
    '["Managing commercial agreements with top-tier ethanol producers across India", "Handling export tenders and international inquiries across Southeast Asia and Africa", "Coordinating cross-functional delivery schedules to meet contract milestones", "Representing AB Bioscience at national bio-energy and distillery expos"]'::jsonb,
    'Manager'
),
(
    406,
    'Commercial Sales Executive',
    40,
    'SALES_EXE',
    'Identifies new prospect distilleries, supports sales pipeline tracking, and assists in client proposal generation',
    'Commercial & Sales',
    true,
    350000,
    550000,
    '["Graduate with 1-3 years sales or customer coordination experience", "Good tele-calling, email correspondence, and presentation skills", "Proficiency in MS Office and sales CRM tools"]'::jsonb,
    '["Mapping newly announced grain-based distillery projects across states", "Initiating introductory contact with plant procurement and technical heads", "Sending product introductory brochures and Product Data Sheets (PDS)", "Maintaining sales lead database and scheduling introductory meetings"]'::jsonb,
    'Junior'
),

-- Supply Chain & Logistics (Dept 50, 501, 502)
(
    501,
    'Supply Chain & Warehouse Manager',
    50,
    'SCM_MGR',
    'Manages Gurgaon central biomolecule warehouse, cold-chain logistics, inventory control, and raw material procurement',
    'Supply Chain & Logistics',
    true,
    1000000,
    1500000,
    '["Degree in Supply Chain Management, Logistics, or MBA Operations", "7-10 years experience in warehouse operations for temperature-sensitive bio-products", "Expert in cold-chain logistics, ERP inventory systems, and transport contracts"]'::jsonb,
    '["Managing end-to-end warehouse storage of enzymes under controlled conditions", "Overseeing inventory planning to maintain buffer stocks without shelf-life expiry", "Negotiating freight and Reefer transport contracts for pan-India distribution", "Enforcing strict warehouse safety, material handling, and FIFO dispatch SOPs"]'::jsonb,
    'Manager'
),
(
    502,
    'Warehouse & Cold Storage Supervisor',
    501,
    'WH_COLD_SUP',
    'Supervises physical intake, cold storage rooms, batch labeling, stock segregation, and order pick/pack',
    'Supply Chain & Logistics',
    true,
    420000,
    650000,
    '["Graduate / Diploma in Material Management", "3-5 years warehouse experience in chemical, pharma, or bio-ingredient sector", "Familiarity with temperature data loggers and hazardous chemical storage"]'::jsonb,
    '["Monitoring cold storage temperatures daily and logging continuous digital sensor records", "Supervising safe unloading, palletizing, and storage of incoming enzyme barrels and carboys", "Verifying batch numbers, manufacturing dates, and expiry dates before picking", "Conducting monthly physical stock reconciliation against ERP system records"]'::jsonb,
    'Executive'
),
(
    503,
    'Logistics & Dispatch Coordinator',
    502,
    'LOG_DISP_COORD',
    'Coordinates transport carrier bookings, E-way bills, dispatch documentation, and real-time transit tracking',
    'Supply Chain & Logistics',
    true,
    320000,
    500000,
    '["Graduate with 2-4 years experience in freight logistics and transport coordination", "Familiarity with GST E-way bill portal and road transport documentation"]'::jsonb,
    '["Arranging dedicated or part-load transport vehicles with temperature control as required", "Generating delivery challans, packing lists, and GST E-way bills", "Tracking shipments in transit and alerting client plant receiving teams", "Securing and archiving signed Proof of Delivery (POD) from client plant sites"]'::jsonb,
    'Executive'
),

-- Technical Services & Process Applications (Dept 60, 601, 602)
(
    601,
    'Head of Technical Services',
    60,
    'HEAD_TECH_SVC',
    'Directs nationwide on-site technical services, distillery trial protocols, and client plant process optimization',
    'Technical Services',
    true,
    1600000,
    2400000,
    '["B.Tech / M.Tech in Alcohol Technology, Biochemical Engineering, or Chemical Technology", "10+ years plant operations or technical service leadership in grain/molasses distilleries", "Recognized authority on fermentation efficiency and ethanol recovery"]'::jsonb,
    '["Formulating technical service strategy and on-site support guidelines", "Leading technical troubleshooting during complex distillery fermentation stalls", "Coordinating plant scale trials to prove biocatalyst yield advantages", "Collaborating with commercial sales leaders on technical business acquisition"]'::jsonb,
    'Director'
),
(
    602,
    'Technical Services Manager - Distilleries',
    601,
    'TECH_SVC_MGR_DIST',
    'Manages distillery technical support engineers, coordinates trial schedules, and evaluates yield enhancement data',
    'Technical Services',
    true,
    1000000,
    1500000,
    '["Degree / Diploma in Alcohol Technology or Biotechnology", "7+ years hands-on distillery technical application experience", "Deep knowledge of multi-pressure distillation, ENA, and DDGS drying systems"]'::jsonb,
    '["Scheduling and executing plant trials for ArrowLiq and ArrowSac enzyme systems", "Analyzing plant operational parameters (Brix, temperature, acid values, conversion rates)", "Designing customized enzyme dosing matrices for varied grain feedstocks (corn, broken rice)", "Presenting trial conclusion reports to client distillery management"]'::jsonb,
    'Manager'
),
(
    603,
    'Senior Application Specialist - Grain Fermentation',
    601,
    'SR_APP_SPEC',
    'Executes on-site enzyme dosage trials, yeast propagation, and fermentation monitoring at grain distilleries',
    'Technical Services',
    true,
    650000,
    1000000,
    '["B.Sc / M.Sc / B.Tech in Biotechnology, Microbiology, or Alcohol Tech", "4-6 years on-site distillery or bio-ethanol plant experience", "Willingness to travel extensively to distillery clusters across India"]'::jsonb,
    '["Conducting plant-floor trials during mash cooking, liquefaction, and saccharification", "Optimizing enzyme dosing to reduce residual starch and improve alcohol recovery per ton", "Training distillery shift supervisors on optimal biocatalyst handling and storage", "Documenting daily trial logs and submitting comparative performance data"]'::jsonb,
    'Senior Executive'
),
(
    604,
    'Field Application Executive',
    601,
    'FIELD_APP_EXE',
    'Assists in plant trial sampling, mash viscosity testing, and operational parameter logging on-site',
    'Technical Services',
    true,
    380000,
    600000,
    '["Diploma / B.Sc in Chemistry, Biotech, or Sugar/Distillery Technology", "1-3 years field technical or plant operational experience", "Energetic, customer-oriented, and ready for frequent field visits"]'::jsonb,
    '["Collecting mash and fermenter samples during trial runs", "Performing on-site tests: iodine starch test, Brix, alcohol percentage, and pH", "Assisting client operators in chemical dosing and biocatalyst addition", "Compiling preliminary plant observation summaries for technical managers"]'::jsonb,
    'Executive'
),
(
    605,
    'Process Chemicals Technical Specialist',
    602,
    'PROC_CHEM_SPEC',
    'Provides technical expertise for boiler water, cooling towers, anti-scalants, and sugar processing chemical solutions',
    'Technical Services',
    true,
    500000,
    800000,
    '["B.Sc / B.Tech in Chemistry or Chemical Engineering", "3-5 years experience in industrial water treatment and process chemicals", "Familiarity with sugar mill boiling house operations and distillery utilities"]'::jsonb,
    '["Conducting comprehensive boiler and cooling tower water audits at client plants", "Recommending customized chemical dosing programs (anti-scalants, corrosion inhibitors)", "Testing water hardness, silica, TDS, and microbiological slime levels", "Troubleshooting fouling, heat transfer drop, and tube scaling issues"]'::jsonb,
    'Executive'
),

-- Quality Assurance & Regulatory Affairs (Dept 70, 701, 702)
(
    701,
    'QA & Regulatory Affairs Manager',
    70,
    'QA_REG_MGR',
    'Leads company-wide Quality Management System, regulatory documentation, FSSAI compliance, and ISO audits',
    'Quality & Regulatory',
    true,
    1100000,
    1700000,
    '["M.Sc in Chemistry, Microbiology, or Food Science", "8+ years in QA/QC management within biotech, food enzyme, or chemical sector", "Certified ISO 9001 / FSSC 22000 Lead Auditor preferred"]'::jsonb,
    '["Overseeing total quality assurance across incoming materials and finished batches", "Directing regulatory filings, FSSAI compliance, and export documentation", "Conducting internal quality audits and managing client audit inspections", "Managing customer quality complaints and Root Cause / CAPA implementations"]'::jsonb,
    'Manager'
),
(
    702,
    'Senior QC Analytical Chemist',
    701,
    'SR_QC_CHEM',
    'Supervises analytical QC testing, enzyme activity verification, and authorizes batch release Certificates of Analysis',
    'Quality & Regulatory',
    true,
    550000,
    850000,
    '["M.Sc in Analytical Chemistry or Biochemistry", "4-6 years experience in QC analytical testing with enzyme or chemical manufacturer", "Experience with HPLC, UV-Vis spectrophotometers, and density meters"]'::jsonb,
    '["Conducting release testing for each production batch of biocatalysts", "Approving and issuing official Certificates of Analysis (CoA)", "Maintaining analytical standards and reference samples", "Investigating Out-of-Specification (OOS) results and implementing corrections"]'::jsonb,
    'Senior Executive'
),
(
    703,
    'QC Laboratory Analyst',
    701,
    'QC_ANALYST',
    'Conducts routine batch testing, pH, density, microbial limit tests, and packaging inspection',
    'Quality & Regulatory',
    true,
    300000,
    480000,
    '["B.Sc / M.Sc in Chemistry or Life Sciences", "1-3 years QC testing experience in manufacturing plant or commercial testing lab", "Attention to detail and neat documentation capability"]'::jsonb,
    '["Sampling incoming raw materials, packaging, and finished enzyme products", "Performing routine physical-chemical analysis and microbial counts", "Logging batch quality records in the company ERP system", "Verifying product labels, safety warnings, and seal integrity"]'::jsonb,
    'Junior'
),
(
    704,
    'Regulatory Affairs & Documentation Executive',
    702,
    'REG_DOC_EXE',
    'Prepares Technical Data Sheets (TDS), Safety Data Sheets (MSDS), and manages FSSAI and statutory certifications',
    'Quality & Regulatory',
    true,
    420000,
    650000,
    '["B.Sc / M.Sc in Life Sciences, Chemistry, or Regulatory Affairs", "2-4 years experience preparing chemical/biotech technical documentation", "Familiarity with GHS format MSDS, FSSAI regulations, and ISO standards"]'::jsonb,
    '["Drafting and updating Product Data Sheets (PDS) and Technical Data Sheets (TDS)", "Creating GHS-compliant Material Safety Data Sheets (MSDS) for all enzyme & chemical SKUs", "Filing FSSAI food-grade compliance documents and annual regulatory returns", "Providing documentation packages for client vendor registration audits"]'::jsonb,
    'Executive'
)
ON CONFLICT (id) DO UPDATE SET
    designation = EXCLUDED.designation,
    main_department_id = EXCLUDED.main_department_id,
    code = EXCLUDED.code,
    description = EXCLUDED.description,
    job_family = EXCLUDED.job_family,
    is_active = EXCLUDED.is_active,
    min_salary = EXCLUDED.min_salary,
    max_salary = EXCLUDED.max_salary,
    requirements = EXCLUDED.requirements,
    responsibilities = EXCLUDED.responsibilities,
    level = EXCLUDED.level;

-- Advance sequence to prevent primary key collisions when adding roles via UI
SELECT setval(pg_get_serial_sequence('public.positions', 'id'), COALESCE((SELECT MAX(id) FROM public.positions), 1));


-- ============================================================================
-- 3. LEAVE TYPES
-- ============================================================================
INSERT INTO public.leave_types (
    id, leave_code, leave_name, description, is_carry_forward, max_carry_forward,
    is_encashable, max_consecutive_days, requires_document, notice_period_days,
    approval_levels, is_active, created_at
) VALUES
(
    1,
    'CL',
    'Casual Leave',
    'Short-term casual leave for personal work, urgent family obligations, or unforeseen contingencies',
    false,
    0,
    false,
    3,
    false,
    1,
    1,
    true,
    now()
),
(
    2,
    'SL',
    'Sick / Medical Leave',
    'Leave granted for illness, medical appointments, surgery, or health recovery (medical certificate required for > 2 days)',
    false,
    0,
    false,
    7,
    true,
    0,
    1,
    true,
    now()
),
(
    3,
    'PL',
    'Privilege / Earned Leave',
    'Annual earned leave for planned vacations, rest, and personal rejuvenation (accrues monthly, carry forward allowed)',
    true,
    15,
    true,
    15,
    false,
    7,
    2,
    true,
    now()
),
(
    4,
    'COMP',
    'Compensatory Off',
    'Compensatory time off earned by working on designated weekly offs or public holidays during critical distillery trials',
    false,
    0,
    false,
    2,
    false,
    1,
    1,
    true,
    now()
),
(
    5,
    'MATERNITY',
    'Maternity Leave',
    'Statutory paid leave for female employees under the Maternity Benefit Act (up to 26 weeks for eligible childbirth)',
    false,
    0,
    false,
    182,
    true,
    30,
    2,
    true,
    now()
),
(
    6,
    'PATERNITY',
    'Paternity Leave',
    'Paid leave granted to male employees on the birth or legal adoption of a child to support the family',
    false,
    0,
    false,
    15,
    true,
    7,
    1,
    true,
    now()
),
(
    7,
    'BEREAVEMENT',
    'Bereavement Leave',
    'Compassionate leave granted in the unfortunate event of the demise of an immediate family member',
    false,
    0,
    false,
    5,
    false,
    0,
    1,
    true,
    now()
),
(
    8,
    'MARRIAGE',
    'Marriage Leave',
    'Special celebratory leave granted to an employee on the joyous occasion of their own wedding',
    false,
    0,
    false,
    5,
    true,
    15,
    2,
    true,
    now()
),
(
    9,
    'LWP',
    'Leave Without Pay',
    'Authorized unpaid leave for extended absences when all other eligible leave balances have been exhausted',
    false,
    0,
    false,
    90,
    true,
    7,
    2,
    true,
    now()
)
ON CONFLICT (id) DO UPDATE SET
    leave_code = EXCLUDED.leave_code,
    leave_name = EXCLUDED.leave_name,
    description = EXCLUDED.description,
    is_carry_forward = EXCLUDED.is_carry_forward,
    max_carry_forward = EXCLUDED.max_carry_forward,
    is_encashable = EXCLUDED.is_encashable,
    max_consecutive_days = EXCLUDED.max_consecutive_days,
    requires_document = EXCLUDED.requires_document,
    notice_period_days = EXCLUDED.notice_period_days,
    approval_levels = EXCLUDED.approval_levels,
    is_active = EXCLUDED.is_active;

-- Advance sequence to prevent primary key collisions when adding leave types via UI
SELECT setval(pg_get_serial_sequence('public.leave_types', 'id'), COALESCE((SELECT MAX(id) FROM public.leave_types), 1));


-- ============================================================================
-- 4. LEAVE ALLOCATION RULES
-- ============================================================================
INSERT INTO public.leave_allocation_rules (
    id, leave_type_id, employee_level, years_of_service_min, years_of_service_max,
    monthly_accrual, annual_allocation, is_active
) VALUES
(1, 1, 'ALL', 0, 99, 1.0, 12, true),   -- Casual Leave: 12 days/yr (1 day/mo)
(2, 2, 'ALL', 0, 99, 1.0, 12, true),   -- Sick Leave: 12 days/yr (1 day/mo)
(3, 3, 'ALL', 0, 99, 1.25, 15, true),  -- Privilege Leave: 15 days/yr (1.25 day/mo)
(4, 5, 'ALL', 0, 99, 0, 182, true),    -- Maternity Leave: 182 days (26 weeks)
(5, 6, 'ALL', 0, 99, 0, 15, true),     -- Paternity Leave: 15 days
(6, 7, 'ALL', 0, 99, 0, 5, true),      -- Bereavement Leave: 5 days
(7, 8, 'ALL', 0, 99, 0, 5, true)       -- Marriage Leave: 5 days
ON CONFLICT (id) DO UPDATE SET
    leave_type_id = EXCLUDED.leave_type_id,
    employee_level = EXCLUDED.employee_level,
    monthly_accrual = EXCLUDED.monthly_accrual,
    annual_allocation = EXCLUDED.annual_allocation,
    is_active = EXCLUDED.is_active;

-- Advance sequence
SELECT setval(pg_get_serial_sequence('public.leave_allocation_rules', 'id'), COALESCE((SELECT MAX(id) FROM public.leave_allocation_rules), 1));


-- ============================================================================
-- 5. USER APP CONFIGURATION
-- ============================================================================
-- Office location: The Hive by Satya Group, Sector 102, Gurgaon
INSERT INTO public.user_app_config (
    id, platform, min_version, max_version, force_update,
    is_spanco_enabled, is_feasibility_enabled, office_location, is_face_recognition_enabled
) VALUES (
    1,
    'android',
    1,
    1,
    false,
    true,
    true,
    '28.4792, 76.9748',
    true
)
ON CONFLICT (id) DO UPDATE SET
    platform = EXCLUDED.platform,
    office_location = EXCLUDED.office_location,
    is_spanco_enabled = EXCLUDED.is_spanco_enabled,
    is_feasibility_enabled = EXCLUDED.is_feasibility_enabled,
    is_face_recognition_enabled = EXCLUDED.is_face_recognition_enabled;

COMMIT;
