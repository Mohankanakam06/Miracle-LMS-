import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useClasses, useCourses, useAssignments, useSubmissions, useTimetable } from '@/hooks/useLMS';
import { useSeedDatabase } from '@/hooks/useDatabaseSeed';
import { toast } from 'sonner';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Plus, ChevronDown, ChevronRight, CheckCircle, Circle, Loader2, Filter, Database } from 'lucide-react';
import { cn } from '@/lib/utils';
import AddSubjectDialog from '@/components/courses/AddSubjectDialog';

// JNTU-GV Comprehensive Syllabus Data (R20, R21, R22, R23) - Frontend Fallback
export const JNTUGV_DATA = [
  // R23 REGULATION - CSE
  {
    id: '1',
    code: 'R231101',
    name: 'Linear Algebra and Calculus',
    semester: 1,
    credits: 3,
    department: 'Basic Science',
    description: 'Matrix algebra, eigen values/vectors, calculus of multivariable functions',
    units: [
      { title: 'Unit I: Matrices', content: 'Rank of a matrix by echelon form, normal form. Cauchy-Binet formulae (without proof). Inverse of non-singular matrix by Gauss-Jordan method. System of linear equations: solving system of homogeneous and non-homogeneous linear equations - Gauss elimination method, Gauss Seidel Iteration Method.' },
      { title: 'Unit II: Linear Transformation and Orthogonal Transformation', content: 'Eigenvalues, Eigenvectors and their properties (without proof). Diagonalization of a matrix, Cayley-Hamilton Theorem (without proof), finding inverse and power of a matrix using Cayley-Hamilton Theorem. Quadratic forms and their nature, reduction of quadratic form to canonical forms by orthogonal transformation.' },
      { title: 'Unit III: Calculus', content: 'Mean Value Theorems: Rolle’s Theorem, Lagrange’s mean value theorem with their geometrical interpretation, Cauchy’s mean value theorem, Taylor’s and Maclaurin’s theorems with remainders (without proof). Problems and applications.' },
      { title: 'Unit IV: Partial Differentiation and Applications', content: 'Partial derivatives, total derivatives, chain rule, change of variables, Taylor’s and Maclaurin’s series expansion of functions of two variables. Jacobians, maxima and minima of functions of two variables, method of Lagrange multipliers.' },
      { title: 'Unit V: Multiple Integrals', content: 'Double and triple integrals, change of order of integration, change of variables to polar, cylindrical, and spherical coordinates. Finding areas using double integrals and volumes using double and triple integrals.' }
    ]
  },
  {
    id: '2',
    code: 'R231102',
    name: 'Engineering Physics',
    semester: 1,
    credits: 3,
    department: 'Basic Science',
    description: 'Optics, Lasers, Quantum Mechanics, Semiconductors',
    units: [
      { title: 'Unit I: Wave Optics', content: 'Principle of Superposition, Interference of light, Newton’s rings. Diffraction: Fraunhofer diffraction at single slit, double slit, N-slits. Polarization: Polarization by reflection, refraction, and double refraction. Quarter and Half wave plates.' },
      { title: 'Unit II: Lasers and Fiber Optics', content: 'Lasers: Absorption, spontaneous and stimulated emission, population inversion. Ruby laser, He-Ne laser. Fiber Optics: Principle of optical fiber, acceptance angle, numerical aperture, types of optical fibers, losses in optical fibers.' },
      { title: 'Unit III: Quantum Mechanics', content: 'Introduction, matter waves, De Broglie’s hypothesis, Heisenberg’s Uncertainty Principle. Time-independent Schrodinger wave equation, Physical significance of wave function. Particle in a one-dimensional potential box.' },
      { title: 'Unit IV: Band Theory of Solids & Semiconductors', content: 'Free electron theory, Bloch’s theorem, Kronig-Penney model (qualitative). Classification of solids. Intrinsic and extrinsic semiconductors, Carrier concentration, Hall Effect.' },
      { title: 'Unit V: Crystallography and Superconductivity', content: 'Crystal systems, Bravais lattices, Miller indices. Bragg’s law. Superconductivity: Meissner effect, Type I and Type II superconductors, BCS theory. Applications.' }
    ]
  },
  {
    id: '3',
    code: 'R231103',
    name: 'Communicative English',
    semester: 1,
    credits: 2,
    department: 'Humanities',
    description: 'Listening, Speaking, Reading, Writing skills',
    units: [
      { title: 'Unit I: Introduction to Communication', content: 'The importance of communication, Types of communication, Barriers to communication. Grammar: Articles, Prepositions, Tenses.' },
      { title: 'Unit II: Listening Skills', content: 'Types of listening, Listening for general content, Listening for specific information. Note-taking and Note-making. Common errors in listening.' },
      { title: 'Unit III: Speaking Skills', content: 'Jam session, Group Discussions, Debate, Interview skills. Pronunciation: Sounds of English, Stress, Intonation.' },
      { title: 'Unit IV: Reading Skills', content: 'Skimming, Scanning, Intensive and Extensive reading. Reading comprehension. Vocabulary building: Synonyms, Antonyms, One-word substitutes.' },
      { title: 'Unit V: Writing Skills', content: 'Paragraph writing, Letter writing (Formal & Informal), Email etiquette, Report writing, Resume preparation.' }
    ]
  },
  {
    id: '4',
    code: 'R231104',
    name: 'Basic Civil & Mechanical Engineering',
    semester: 1,
    credits: 3,
    department: 'Engineering Science',
    description: 'Basic concepts of Civil and Mechanical Engineering',
    units: [
      { title: 'Unit I (Civil): Building Materials', content: 'Stones, Bricks, Cement, Aggregates, Concrete. Properties and uses. Substructure and Superstructure. foundation types. Brick masonry.' },
      { title: 'Unit II (Civil): Surveying & Transportation', content: 'Surveying: Objectives, Types, Linear measurements. Basics of leveling. Transportation: Types of roads, Highway cross-section. Dams and Water storages.' },
      { title: 'Unit III (Mech): Thermodynamics', content: 'Basic concepts, System, Surroundings, Laws of thermodynamics. Zeroth law, First law, Second law. Heat engines, Refrigerators, Heat pumps. IC Engines: 2-stroke and 4-stroke engines.' },
      { title: 'Unit IV (Mech): Manufacturing Processes', content: 'Casting: Patterns, Moulding. Welding: Arc welding, Gas welding. Machining: Lathe operations, Drilling. Additive manufacturing overview.' },
      { title: 'Unit V (Mech): Power Transmission & Robotics', content: 'Power Transmission: Belts, Ropes, Chains, Gears. Drives. Introduction to Robotics: Components, Classifications, Applications.' }
    ]
  },
  {
    id: '5',
    code: 'R231105',
    name: 'Introduction to Programming',
    semester: 1,
    credits: 3,
    department: 'CSE',
    description: 'Problem solving using C, Arrays, Pointers, Structures',
    units: [
      { title: 'Unit I: Basics of Computers & C Language', content: 'Computer systems, creating and running programs. Algorithm, Flowchart. C Basics: Structure of C program, Data types, Variables, Constants, I/O statements.' },
      { title: 'Unit II: Operators & Control Statements', content: 'Operators: Arithmetic, Relational, Logical, Bitwise. Expressions. Control Statements: Selection (if, switch), Iteration (while, do-while, for), Jump statements (break, continue, goto).' },
      { title: 'Unit III: Arrays & Strings', content: 'Arrays: One-dimensional and Multi-dimensional arrays. Strings: Declaration, Initialization, String handling functions. Bubble sort, Selection sort, Linear and Binary search.' },
      { title: 'Unit IV: Functions & Pointers', content: 'Functions: Definition, Declaration, Parameter passing, Recursion, Storage classes. Pointers: Declaration, Pointer arithmetic, Pointers to pointers, Arrays of pointers.' },
      { title: 'Unit V: Structures, Unions & Files', content: 'Structures: Definition, Nested structures, Arrays of structures. Unions. Dynamic Memory Allocation (malloc, calloc, realloc). File Handling: Opening, Closing, Reading, Writing files.' }
    ]
  },
  { id: '6', code: 'R231106', name: 'Engineering Workshop', semester: 1, credits: 2, department: 'Engineering Science', description: 'Hands-on training in various engineering trades' },
  {
    id: '7',
    code: 'R231201',
    name: 'Differential Equations & Vector Calculus',
    semester: 2,
    credits: 3,
    department: 'Basic Science',
    description: 'ODEs, PDEs, Vector Differentiation and Integration',
    units: [
      { title: 'Unit I: Differential Equations of First Order', content: 'Exact, Linear and Bernoulli equations. Newton’s Law of Cooling, Law of Natural Growth and Decay. Orthogonal trajectories.' },
      { title: 'Unit II: Higher Order Differential Equations', content: 'Linear differential equations of second and higher order with constant coefficients. Non-homogeneous term of the type e^ax, sin(ax), cos(ax), polynomials. Method of variation of parameters.' },
      { title: 'Unit III: Partial Differential Equations', content: 'Formation of PDEs, Solutions of first order linear (Lagrange) equation. Solutions of linear PDEs with constant coefficients. Homogeneous and Non-homogeneous.' },
      { title: 'Unit IV: Vector Differentiation', content: 'Scalar and vector point functions. Gradient, Divergence, Curl and their physical interpretations. Vector identities. Directional derivatives.' },
      { title: 'Unit V: Vector Integration', content: 'Line integral, Work done, Surface integral, Volume integral. Green’s Theorem, Stokes’ Theorem, Gauss Divergence Theorem (without proofs) and applications.' }
    ]
  },
  {
    id: '8',
    code: 'R231202',
    name: 'Engineering Chemistry',
    semester: 2,
    credits: 3,
    department: 'Basic Science',
    description: 'Structure, Bonding, Electrochemistry, Polymers',
    units: [
      { title: 'Unit I: Structure & Bonding Models', content: 'Molecular orbital theory: Bonding in homo and hetero diatomic molecules. Energy level diagrams of N2, O2, F2. Crystal field theory: Splitting of d-orbitals in octahedral and tetrahedral complexes.' },
      { title: 'Unit II: Modern Engineering Materials', content: 'Polymers: Mechanism of polymerization. Plastics: Thermoplastics and Thermosets. Preparation of PVC, Bakelite. Nanomaterials: Introduction, Sol-Gel method, Carbon Nanotubes (CNTs), Applications.' },
      { title: 'Unit III: Electrochemistry and Applications', content: 'Electrochemical cells, Nernst equation. Batteries: Primary (Lithium cell) and Secondary (Lead-acid, Li-ion). Fuel cells: H2-O2 fuel cell. Corrosion: Types, Factors, Prevention methods.' },
      { title: 'Unit IV: Water Technology', content: 'Hardness of water, Units. Estimation of hardness by EDTA method. Boiler troubles: Scale, Sludge, Priming, Foaming. Water treatment: Zeolite process, Ion-exchange process. Desalination (Reverse Osmosis).' },
      { title: 'Unit V: Spectroscopy & Instrumental Methods', content: 'Electromagnetic spectrum. UV-Visible spectroscopy: Beer-Lambert’s law. IR Spectroscopy: Modes of vibration, Fingerprint region. Conductometry and Potentiometry: Titrations.' }
    ]
  },
  { id: '9', code: 'R231203', name: 'Engineering Graphics', semester: 2, credits: 3, department: 'Engineering Science', description: 'CAD, Projections, Isometric Views' },
  { id: '10', code: 'R231204', name: 'Basic Electrical & Electronics Engineering', semester: 2, credits: 3, department: 'Engineering Science', description: 'Circuits, Machines, Semiconductor Devices' },
  { id: '11', code: 'R231205', name: 'Data Structures', semester: 2, credits: 3, department: 'CSE', description: 'Linked Lists, Stacks, Queues, Trees, Graphs, Hashing' },
  { id: '12', code: 'R231206', name: 'Environmental Science', semester: 2, credits: 2, department: 'Basic Science', description: 'Ecosystems, Pollution, Sustainability' },
  {
    id: '13',
    code: 'R232101',
    name: 'Mathematical Foundations of Computer Science',
    semester: 3,
    credits: 3,
    department: 'CSE',
    description: 'Logic, Sets, Relations, Functions, Graph Theory',
    units: [
      { title: 'Unit I: Mathematical Logic', content: 'Statements and notations, Connectives, Well-formed formulas, Truth Tables, Tautology, Equivalence implication, Normal forms, Quantifiers, Universal quantifiers.' },
      { title: 'Unit II: Set Theory & Relations', content: 'Basic concepts of set theory, Operations on sets. Relations: Properties, Equivalence relations, Partial ordering relations, Hasse diagrams, Lattices.' },
      { title: 'Unit III: Functions & Algebraic Structures', content: 'Functions: Types, Composition, Inverse. Algebraic systems: Semigroups, Monoids, Groups, Subgroups. Homomorphism, Isomorphism.' },
      { title: 'Unit IV: Combinatorics', content: 'Basics of counting, Permutations, Combinations, Inclusion-Exclusion principle, Pigeonhole principle. Recurrence relations, Solving recurrence relations.' },
      { title: 'Unit V: Graph Theory', content: 'Basic concepts, Isomorphism and Subgraphs, Trees and their properties, Spanning trees, Planar graphs, Euler’s formula, Hamiltonian and Eulerian graphs.' }
    ]
  },
  { id: '14', code: 'R232102', name: 'Universal Human Values', semester: 3, credits: 2, department: 'Humanities', description: 'Understanding Harmony, Ethical Conduct' },
  { id: '15', code: 'R232103', name: 'Digital Logic & Computer Organization', semester: 3, credits: 3, department: 'CSE', description: 'Digital Circuits, CPU Organization, Memory' },
  { id: '16', code: 'R232104', name: 'Software Engineering', semester: 3, credits: 3, department: 'CSE', description: 'SDLC, Agile, Testing, Maintenance' },
  {
    id: '17',
    code: 'R232105',
    name: 'Object Oriented Programming through Java',
    semester: 3,
    credits: 3,
    department: 'CSE',
    description: 'Classes, Objects, Inheritance, Polymorphism, Exception Handling',
    units: [
      { title: 'Unit I: Introduction to OOP & Java', content: 'History of Java, JVM, Data types, Variables, Operators, Control structures. Arrays. Introduction to OOP: Classes, Objects, Methods, Constructors, ' },
      { title: 'Unit II: Inheritance & Polymorphism', content: 'Inheritance types, Super keyword, Method Overloading, Method Overriding, Abstract classes, Final keyword. Polymorphism: Static and Dynamic binding.' },
      { title: 'Unit III: Packages & Interfaces', content: 'Defining, Creating and Accessing a Package. Import statements. Interfaces: Defining, Implementing, Extending interfaces. Multiple inheritance using interfaces.' },
      { title: 'Unit IV: Exception Handling & Multithreading', content: 'Exception types, Try-Catch-Finally, Throw, Throws. User-defined exceptions. Multithreading: Thread life cycle, Creating threads, Synchronization.' },
      { title: 'Unit V: Files & Collections', content: 'File I/O streams, Reading/Writing files. Generic Collections: List, Set, Map interfaces. ArrayList, LinkedList, HashMap classes. Iterators.' }
    ]
  },
  { id: '18', code: 'R232201', name: 'Probability and Statistics', semester: 4, credits: 3, department: 'Basic Science', description: 'Probability distributions, Sampling, Hypothesis Testing' },
  { id: '19', code: 'R232202', name: 'Operating Systems', semester: 4, credits: 3, department: 'CSE', description: 'Process Management, Memory Management, File Systems' },
  { id: '20', code: 'R232203', name: 'Database Management Systems', semester: 4, credits: 3, department: 'CSE', description: 'ER Models, SQL, Normalization, Transactions' },
  { id: '21', code: 'R232204', name: 'Formal Languages and Automata Theory', semester: 4, credits: 3, department: 'CSE', description: 'Finite Automata, Grammars, Turing Machines' },
  { id: '22', code: 'R232205', name: 'Web Technologies', semester: 4, credits: 3, department: 'CSE', description: 'HTML, CSS, JavaScript, React, Node.js' },
  {
    id: '23',
    code: 'R233101',
    name: 'Artificial Intelligence & Machine Learning',
    semester: 5,
    credits: 3,
    department: 'CSE',
    description: 'AI agents, Search algorithms, ML basics, Neural Networks',
    units: [
      { title: 'Unit I: Introduction to AI', content: 'History of AI, Intelligent Agents, Agents and Environments. Problem Solving: State-space search, Uninformed Search (BFS, DFS), Heuristic Search (A*, Best-first). constraint satisfaction.' },
      { title: 'Unit II: Knowledge Representation & Logic', content: 'Propositional Logic, First-Order Logic. Inference in FOL. Game Playing: Minimax algorithm, Alpha-Beta pruning. Knowledge Engineering.' },
      { title: 'Unit III: Introduction to Machine Learning', content: 'Types of learning: Supervised, Unsupervised, Reinforcement. Regression: Linear, Logistic. Classification: K-Nearest Neighbors, Decision Trees, Naive Bayes.' },
      { title: 'Unit IV: Neural Networks', content: 'Biological Neuron, Artificial Neuron, Perceptron, Multilayer Perceptron (MLP). Backpropagation algorithm. Activation functions. Introduction to Deep Learning.' },
      { title: 'Unit V: Clustering & Ensembles', content: 'Clustering: K-Means, Hierarchical clustering. Ensemble Methods: Bagging, Boosting, Random Forest. Evaluation Metrics for ML models.' }
    ]
  },
  {
    id: '24',
    code: 'R233102',
    name: 'Object Oriented Software Engineering',
    semester: 5,
    credits: 3,
    department: 'CSE',
    description: 'Modeling, Design patterns, Architecture',
    units: [
      { title: 'Unit I: Software Engineering & Process Models', content: 'The Nature of Software, Software Process, Process Models: Waterfall, Incremental, Evolutionary, Spiral, Unified Process. Agile Methodology: Scrum, XP.' },
      { title: 'Unit II: Requirements Engineering', content: 'Functional and Non-functional requirements. Use Case Modeling. Analysis Modeling: Class diagrams, Sequence diagrams, Activity diagrams, State charts.' },
      { title: 'Unit III: Design Concepts', content: 'Design process, Design concepts: Abstraction, Architecture, Patterns, Modularity. Architectural Design. User Interface Design.' },
      { title: 'Unit IV: Design Patterns', content: 'Introduction to Design Patterns. Creational Patterns (Singleton, Factory), Structural Patterns (Adapter, Decorator), Behavioral Patterns (Observer, Strategy).' },
      { title: 'Unit V: Testing & Quality', content: 'Software Testing Strategies: Unit, Integration, System, Acceptance testing. Black-box vs White-box testing. Software Quality Assurance and Maintenance.' }
    ]
  },
  {
    id: '25',
    code: 'R233103',
    name: 'Computer Networks',
    semester: 5,
    credits: 3,
    department: 'CSE',
    description: 'OSI Model, TCP/IP, Routing, Wireless Networks',
    units: [
      { title: 'Unit I: Introduction & Physical Layer', content: 'Network Hardware, Network Software, Reference Models: OSI, TCP/IP. Physical Layer: Guided and Unguided Transmission Media, Switching.' },
      { title: 'Unit II: Data Link Layer', content: 'Error Detection and Correction. Elementary Data Link Protocols. Sliding Window Protocols. MAC Sublayer: ALOHA, CSMA/CD, Ethernet.' },
      { title: 'Unit III: Network Layer', content: 'Routing Algorithms: Shortest Path, Flooding, Distance Vector, Link State. Congestion Control. IPv4, IPv6 Addressing.' },
      { title: 'Unit IV: Transport Layer', content: 'Process-to-Process Delivery: UDP, TCP. Connection Management, Flow Control, Error Control. TCP Congestion Control.' },
      { title: 'Unit V: Application Layer', content: 'DNS - Domain Name System. E-mail: SMTP, POP3, IMAP. WWW and HTTP. FTP. Network Security: Cryptography basics.' }
    ]
  },
  {
    id: '26',
    code: 'R233104',
    name: 'Mobile Computing',
    semester: 5,
    credits: 3,
    department: 'CSE',
    description: 'Wireless Communication, Mobile Network Layer',
    units: [
      { title: 'Unit I: Introduction to Mobile Computing', content: 'Mobile Computing Architecture, Novel Applications, Limitations. GSM: Architecture, Protocols, Handover. GPRS.' },
      { title: 'Unit II: MAC Protocols', content: 'Wireless MAC Issues. Hidden and Exposed Terminal Problems. MAC Protocols: SDMA, FDMA, TDMA, CDMA.' },
      { title: 'Unit III: Mobile Network Layer', content: 'Mobile IP: Goals, Entities, IP Packet Delivery, Agent Discovery, Registration, Tunneling and Encapsulation. DHCP.' },
      { title: 'Unit IV: Mobile Transport Layer', content: 'Traditional TCP, Indirect TCP, Snooping TCP, Mobile TCP. Transaction Oriented TCP. WAP Architecture.' },
      { title: 'Unit V: Ad Hoc Networks', content: 'Ad Hoc Networks: Introduction, Routing Protocols (DSDV, DSR, AODV). MANETs. Bluetooth Architecture.' }
    ]
  },
  { id: '27', code: 'R233105', name: 'Microprocessors and Microcontrollers', semester: 5, credits: 3, department: 'CSE', description: '8086, ARM, Embedded Systems' },
  { id: '28', code: 'R233201', name: 'Data Warehousing and Data Mining', semester: 6, credits: 3, department: 'CSE', description: 'Data preprocessing, Mining algorithms, Clustering' },
  { id: '29', code: 'R233202', name: 'Compiler Design', semester: 6, credits: 3, department: 'CSE', description: 'Lexical Analysis, Parsing, Code Generation' },
  { id: '30', code: 'R233203', name: 'Design and Analysis of Algorithms', semester: 6, credits: 3, department: 'CSE', description: 'Divide and Conquer, Dynamic Programming, Greedy Algorithms' },
  { id: '31', code: 'R233204', name: 'DevOps', semester: 6, credits: 3, department: 'CSE', description: 'CI/CD, Containerization, Orchestration' },
  { id: '32', code: 'R233205', name: 'Internet of Things', semester: 6, credits: 3, department: 'CSE', description: 'IoT Architecture, Sensors, Cloud Integration' },
  { id: '33', code: 'R234101', name: 'Cryptography and Network Security', semester: 7, credits: 3, department: 'CSE', description: 'Encryption, Authentication, Security Protocols' },
  { id: '34', code: 'R234102', name: 'Human Resources & Project Management', semester: 7, credits: 3, department: 'Management', description: 'HRM, Project Planning, Risk Management' },
  { id: '35', code: 'R234103', name: 'Deep Learning', semester: 7, credits: 3, department: 'CSE', description: 'CNNs, RNNs, GANs, Transfer Learning' },
  { id: '36', code: 'R234104', name: 'Cloud Computing', semester: 7, credits: 3, department: 'CSE', description: 'Cloud models, Virtualization, Cloud Security' },
  { id: '37', code: 'R234201', name: 'Blockchain Technology', semester: 8, credits: 3, department: 'CSE', description: 'Distributed Ledger, Smart Contracts, Cryptocurrency' },
  { id: '38', code: 'R234202', name: 'Big Data Analytics', semester: 8, credits: 3, department: 'CSE', description: 'Hadoop, Spark, NoSQL Databases' },

  // R23 REGULATION - ECE
  {
    id: '39',
    code: 'R233111',
    name: 'Signals and Systems',
    semester: 3,
    credits: 3,
    department: 'ECE',
    description: 'Signal analysis, Fourier Transform, Laplace Transform',
    units: [
      { title: 'Unit I: Introduction to Signals', content: 'Classification of signals: Continuous and Discrete, Periodic and Aperiodic, Even and Odd, Energy and Power signals. Basic operations on signals. Unit Impulse, Unit Step, Unit Ramp functions.' },
      { title: 'Unit II: Fourier Series & Fourier Transform', content: 'Fourier Series representation of periodic signals, Dirichlet conditions. Fourier Transform: Properties, Magnitude and Phase spectra. Parsevals Theorem.' },
      { title: 'Unit III: Linear Time Invariant Systems', content: 'System properties: Linearity, Causality, Stability, Time-invariance. Impulse Response, Convolution Integral, Convolution Sum. Transfer function.' },
      { title: 'Unit IV: Laplace Transforms', content: 'ROC, Properties of Laplace Transform, Inverse Laplace Transform. Analysis of LTI systems using Laplace Transform. Solution of differential equations.' },
      { title: 'Unit V: Sampling & Z-Transforms', content: 'Sampling Theorem, Aliasing. Reconstruction. Z-Transform: ROC, Properties, Inverse Z-Transform. Analysis of Discrete LTI systems.' }
    ]
  },
  { id: '40', code: 'R233112', name: 'Electronic Devices and Circuits', semester: 3, credits: 3, department: 'ECE', description: 'Diodes, BJT, FET, Amplifiers' },
  { id: '41', code: 'R233113', name: 'Network Analysis', semester: 3, credits: 3, department: 'ECE', description: 'Circuit theorems, Network functions, Two-port networks' },
  { id: '42', code: 'R233211', name: 'Analog Communications', semester: 4, credits: 3, department: 'ECE', description: 'AM, FM, PM Modulation techniques' },
  { id: '43', code: 'R233212', name: 'Digital Electronics', semester: 4, credits: 3, department: 'ECE', description: 'Logic gates, Flip-flops, Counters, Registers' },
  { id: '44', code: 'R233311', name: 'Electromagnetic Fields', semester: 5, credits: 3, department: 'ECE', description: 'Electrostatics, Magnetostatics, Maxwells equations' },
  { id: '45', code: 'R233312', name: 'Digital Signal Processing', semester: 5, credits: 3, department: 'ECE', description: 'DFT, FFT, Digital Filters' },
  { id: '46', code: 'R233411', name: 'VLSI Design', semester: 6, credits: 3, department: 'ECE', description: 'CMOS technology, Logic design, Layout' },
  { id: '47', code: 'R233412', name: 'Microwave Engineering', semester: 6, credits: 3, department: 'ECE', description: 'Waveguides, Antennas, Microwave devices' },
  { id: '47a', code: 'R234111', name: 'Optical Communications', semester: 7, credits: 3, department: 'ECE', description: 'Optical fibers, Transmitters, Receivers' },
  { id: '47b', code: 'R234112', name: 'Embedded Systems', semester: 7, credits: 3, department: 'ECE', description: 'Microcontrollers, Real-time OS, IoT' },
  { id: '47c', code: 'R234211', name: 'Wireless Communications', semester: 8, credits: 3, department: 'ECE', description: 'Mobile communications, 5G, Satellite' },
  { id: '47d', code: 'R234212', name: 'Radar Systems', semester: 8, credits: 3, department: 'ECE', description: 'Radar principles, Signal processing' },

  // R23 REGULATION - EEE
  {
    id: '48',
    code: 'R233121',
    name: 'Electrical Circuits',
    semester: 3,
    credits: 3,
    department: 'EEE',
    description: 'DC and AC circuits, Network theorems',
    units: [
      { title: 'Unit I: Introduction to Electrical Circuits', content: 'Circuit concepts: R, L, C parameters, Voltage and Current sources. Independent and Dependent sources. KCL, KVL, Node and Mesh analysis.' },
      { title: 'Unit II: Network Theorems (DC & AC)', content: 'Superposition, Thevenin’s, Norton’s, Maximum Power Transfer, Reciprocity, Millman’s, Tellegen’s theorems. Applications to DC and AC circuits.' },
      { title: 'Unit III: Single Phase AC Circuits', content: 'RMS, Average values, Form factor, Peak factor. Phasor representation. J-notation. Analysis of R, L, C, RL, RC, RLC series and parallel circuits. Resonance.' },
      { title: 'Unit IV: Two Port Networks', content: 'Impedance (Z), Admittance (Y), Transmission (ABCD), Hybrid (h) parameters. Inter-relations between parameters. Interconnection of two-port networks.' },
      { title: 'Unit V: Transients', content: 'Transient response of RL, RC, RLC circuits for DC and AC excitations using differential equation approach and Laplace Transform method.' }
    ]
  },
  { id: '49', code: 'R233122', name: 'Electrical Machines - I', semester: 3, credits: 3, department: 'EEE', description: 'DC Machines, Transformers' },
  { id: '50', code: 'R233221', name: 'Electrical Machines - II', semester: 4, credits: 3, department: 'EEE', description: 'Induction Motors, Synchronous Machines' },
  { id: '51', code: 'R233222', name: 'Power Electronics', semester: 4, credits: 3, department: 'EEE', description: 'Converters, Inverters, Choppers' },
  { id: '52', code: 'R233321', name: 'Power Systems - I', semester: 5, credits: 3, department: 'EEE', description: 'Generation, Transmission, Distribution' },
  { id: '53', code: 'R233322', name: 'Control Systems', semester: 5, credits: 3, department: 'EEE', description: 'Transfer functions, Stability analysis' },
  { id: '54', code: 'R233421', name: 'Power Systems - II', semester: 6, credits: 3, department: 'EEE', description: 'Load flow, Fault analysis, Protection' },
  { id: '55', code: 'R233422', name: 'Electrical Measurements', semester: 6, credits: 3, department: 'EEE', description: 'Instruments, Bridges, Transducers' },
  { id: '55a', code: 'R234121', name: 'High Voltage Engineering', semester: 7, credits: 3, department: 'EEE', description: 'Insulation, Testing, Lightning protection' },
  { id: '55b', code: 'R234122', name: 'Renewable Energy Systems', semester: 7, credits: 3, department: 'EEE', description: 'Solar, Wind, Hydro power systems' },
  { id: '55c', code: 'R234221', name: 'Smart Grid Technology', semester: 8, credits: 3, department: 'EEE', description: 'Grid automation, Energy management' },
  { id: '55d', code: 'R234222', name: 'Electric Vehicles', semester: 8, credits: 3, department: 'EEE', description: 'EV technology, Battery management, Charging' },

  // R23 REGULATION - MECH
  {
    id: '56',
    code: 'R233131',
    name: 'Engineering Mechanics',
    semester: 3,
    credits: 3,
    department: 'MECH',
    description: 'Statics, Dynamics, Friction',
    units: [
      { title: 'Unit I: Introduction to Mechanics & Forces', content: 'Basic concepts, System of Forces, Resultant of Coplanar concurrent forces. Parallelogram law, Triangle law. Moment of a force, Varignon’s theorem.' },
      { title: 'Unit II: Equilibrium of Systems', content: 'Free Body Diagrams, Equations of Equilibrium. Lami’s Theorem. Types of Supports and Reactions. Equilibrium of rigid bodies.' },
      { title: 'Unit III: Friction', content: 'Types of friction, Laws of friction, Limiting friction, Angle of repose. Applications: Wedge friction, Ladder friction, Screw friction.' },
      { title: 'Unit IV: Centroid & Moment of Inertia', content: 'Centroid of simple figures and composite areas. Center of Gravity. Moment of Inertia: Parallel and Perpendicular axis theorems. MI of composite sections.' },
      { title: 'Unit V: Dynamics', content: 'Kinematics: Rectilinear motion, Curvilinear motion, Projectiles. Kinetics: Newtons Second Law, D’Alembert’s principle. Work-Energy method, Impulse-Momentum method.' }
    ]
  },
  { id: '57', code: 'R233132', name: 'Strength of Materials', semester: 3, credits: 3, department: 'MECH', description: 'Stress, Strain, Bending, Torsion' },
  { id: '58', code: 'R233231', name: 'Thermodynamics', semester: 4, credits: 3, department: 'MECH', description: 'Laws of thermodynamics, Entropy, Cycles' },
  { id: '59', code: 'R233232', name: 'Manufacturing Technology', semester: 4, credits: 3, department: 'MECH', description: 'Casting, Welding, Machining' },
  { id: '60', code: 'R233331', name: 'Fluid Mechanics', semester: 5, credits: 3, department: 'MECH', description: 'Fluid statics, Dynamics, Bernoullis equation' },
  { id: '61', code: 'R233332', name: 'Machine Design', semester: 5, credits: 3, department: 'MECH', description: 'Design of machine elements, Gears, Bearings' },
  { id: '62', code: 'R233431', name: 'Heat Transfer', semester: 6, credits: 3, department: 'MECH', description: 'Conduction, Convection, Radiation' },
  { id: '63', code: 'R233432', name: 'Automobile Engineering', semester: 6, credits: 3, department: 'MECH', description: 'IC Engines, Transmission, Chassis' },
  { id: '63a', code: 'R234131', name: 'Refrigeration and Air Conditioning', semester: 7, credits: 3, department: 'MECH', description: 'Refrigeration cycles, AC systems' },
  { id: '63b', code: 'R234132', name: 'Mechatronics', semester: 7, credits: 3, department: 'MECH', description: 'Sensors, Actuators, Control systems' },
  { id: '63c', code: 'R234231', name: 'Robotics', semester: 8, credits: 3, department: 'MECH', description: 'Robot kinematics, Dynamics, Programming' },
  { id: '63d', code: 'R234232', name: 'Additive Manufacturing', semester: 8, credits: 3, department: 'MECH', description: '3D Printing, Rapid prototyping' },

  // R23 REGULATION - CIVIL
  {
    id: '64',
    code: 'R233141',
    name: 'Surveying',
    semester: 3,
    credits: 3,
    department: 'CIVIL',
    description: 'Leveling, Theodolite, Total station',
    units: [
      { title: 'Unit I: Introduction & Chain Surveying', content: 'Principles of Surveying, Classification, Scales. Ranging, Chaining, Errors in chaining. Tape corrections. Offset methods.' },
      { title: 'Unit II: Compass Surveying & Plane Table', content: 'Prismatic Compass, Surveyors Compass. Bearings, Local Attraction. Dip and Declination. Plane Table: Methods, Radiation, Intersection.' },
      { title: 'Unit III: Leveling & Contouring', content: 'Types of levels, Dumpy level, Leveling staff. HI method, Rise and Fall method. Curvature and Refraction. Contouring: Characteristics, Methods.' },
      { title: 'Unit IV: Theodolite Surveying', content: 'Temporary and Permanent adjustments. Measurement of horizontal and vertical angles. Trigonometric leveling. Tacheometry basics.' },
      { title: 'Unit V: Advanced Surveying', content: 'Introduction to Total Station. EDM. Global Positioning System (GPS). Basics of GIS and Remote Sensing. Curves: Simple curves.' }
    ]
  },
  { id: '65', code: 'R233142', name: 'Building Materials and Construction', semester: 3, credits: 3, department: 'CIVIL', description: 'Cement, Concrete, Masonry' },
  { id: '66', code: 'R233241', name: 'Structural Analysis - I', semester: 4, credits: 3, department: 'CIVIL', description: 'Beams, Frames, Trusses' },
  { id: '67', code: 'R233242', name: 'Geotechnical Engineering', semester: 4, credits: 3, department: 'CIVIL', description: 'Soil properties, Compaction, Consolidation' },
  { id: '68', code: 'R233341', name: 'Structural Analysis - II', semester: 5, credits: 3, department: 'CIVIL', description: 'Slope deflection, Moment distribution' },
  { id: '69', code: 'R233342', name: 'Water Resources Engineering', semester: 5, credits: 3, department: 'CIVIL', description: 'Hydrology, Irrigation, Dams' },
  { id: '70', code: 'R233441', name: 'Design of Concrete Structures', semester: 6, credits: 3, department: 'CIVIL', description: 'RCC design, Beams, Columns, Slabs' },
  { id: '71', code: 'R233442', name: 'Transportation Engineering', semester: 6, credits: 3, department: 'CIVIL', description: 'Highway design, Traffic engineering' },
  { id: '71a', code: 'R234141', name: 'Environmental Engineering', semester: 7, credits: 3, department: 'CIVIL', description: 'Water treatment, Waste management' },
  { id: '71b', code: 'R234142', name: 'Construction Management', semester: 7, credits: 3, department: 'CIVIL', description: 'Project planning, Cost estimation' },
  { id: '71c', code: 'R234241', name: 'Earthquake Engineering', semester: 8, credits: 3, department: 'CIVIL', description: 'Seismic design, Structural dynamics' },
  { id: '71d', code: 'R234242', name: 'Green Building Technology', semester: 8, credits: 3, department: 'CIVIL', description: 'Sustainable construction, LEED certification' },

  // ========================================
  // R22 REGULATION - EXPANDED (Sem 3-8)
  // ========================================
  // Common
  { id: 'R22-1', code: 'R221101', name: 'Mathematics - I', semester: 1, credits: 3, department: 'Basic Science', description: 'Calculus, Differential equations' },
  { id: 'R22-2', code: 'R221102', name: 'Physics', semester: 1, credits: 3, department: 'Basic Science', description: 'Mechanics, Optics' },
  { id: 'R22-3', code: 'R221103', name: 'English', semester: 1, credits: 2, department: 'Humanities', description: 'Communication skills' },
  // CSE
  { id: 'R22-CSE-1', code: 'R222101', name: 'Data Structures', semester: 3, credits: 3, department: 'CSE', description: 'Arrays, Linked Lists, Trees, Graphs' },
  { id: 'R22-CSE-2', code: 'R222102', name: 'Computer Organization', semester: 3, credits: 3, department: 'CSE', description: 'CPU, Memory, I/O organization' },
  { id: 'R22-CSE-3', code: 'R222201', name: 'Operating Systems', semester: 4, credits: 3, department: 'CSE', description: 'Process, Memory, File management' },
  { id: 'R22-CSE-4', code: 'R223101', name: 'Computer Networks', semester: 5, credits: 3, department: 'CSE', description: 'Network layers, Protocols' },
  // ECE
  { id: 'R22-ECE-1', code: 'R222111', name: 'Electronic Devices and Circuits', semester: 3, credits: 3, department: 'ECE', description: 'Diodes, BJT, FET, Amplifiers' },
  { id: 'R22-ECE-2', code: 'R222112', name: 'Signals and Systems', semester: 3, credits: 3, department: 'ECE', description: 'Fourier, Laplace transforms' },
  { id: 'R22-ECE-3', code: 'R222211', name: 'Analog Communications', semester: 4, credits: 3, department: 'ECE', description: 'AM, FM, PM Modulation' },
  { id: 'R22-ECE-4', code: 'R223111', name: 'Microprocessors', semester: 5, credits: 3, department: 'ECE', description: '8086 Architecture, Interfacing' },
  // EEE
  { id: 'R22-EEE-1', code: 'R222121', name: 'Electrical Circuits', semester: 3, credits: 3, department: 'EEE', description: 'Network theorems, AC analysis' },
  { id: 'R22-EEE-2', code: 'R222122', name: 'Electrical Machines-I', semester: 3, credits: 3, department: 'EEE', description: 'DC Machines, Transformers' },
  { id: 'R22-EEE-3', code: 'R222221', name: 'Power Systems-I', semester: 4, credits: 3, department: 'EEE', description: 'Generation, Transmission' },
  { id: 'R22-EEE-4', code: 'R223121', name: 'Control Systems', semester: 5, credits: 3, department: 'EEE', description: 'Time/Freq domain analysis' },
  // MECH
  { id: 'R22-MECH-1', code: 'R222131', name: 'Engineering Mechanics', semester: 3, credits: 3, department: 'MECH', description: 'Statics and Dynamics' },
  { id: 'R22-MECH-2', code: 'R222132', name: 'Thermodynamics', semester: 3, credits: 3, department: 'MECH', description: 'Laws of Thermodynamics' },
  { id: 'R22-MECH-3', code: 'R222231', name: 'Fluid Mechanics', semester: 4, credits: 3, department: 'MECH', description: 'Fluid properties, Flow analysis' },
  { id: 'R22-MECH-4', code: 'R223131', name: 'Heat Transfer', semester: 5, credits: 3, department: 'MECH', description: 'Conduction, Convection, Radiation' },
  // CIVIL
  { id: 'R22-CIVIL-1', code: 'R222141', name: 'Surveying', semester: 3, credits: 3, department: 'CIVIL', description: 'Measurement techniques' },
  { id: 'R22-CIVIL-2', code: 'R222142', name: 'Building Materials', semester: 3, credits: 3, department: 'CIVIL', description: 'Construction materials properties' },
  { id: 'R22-CIVIL-3', code: 'R222241', name: 'Structural Analysis', semester: 4, credits: 3, department: 'CIVIL', description: 'Analysis of trusses/beams' },
  { id: 'R22-CIVIL-4', code: 'R223141', name: 'Concrete Technology', semester: 5, credits: 3, department: 'CIVIL', description: 'Concrete mix design' },

  // ========================================
  // R21 REGULATION - EXPANDED (Sem 3-8)
  // ========================================
  // CSE
  { id: 'R21-CSE-1', code: 'R212101', name: 'Data Structures', semester: 3, credits: 3, department: 'CSE', description: 'DS Implementation' },
  { id: 'R21-CSE-2', code: 'R212201', name: 'Java Programming', semester: 4, credits: 3, department: 'CSE', description: 'OOP with Java' },
  { id: 'R21-CSE-3', code: 'R213101', name: 'Computer Networks', semester: 5, credits: 3, department: 'CSE', description: 'Networking concepts' },
  { id: 'R21-CSE-4', code: 'R213201', name: 'Machine Learning', semester: 6, credits: 3, department: 'CSE', description: 'ML Algorithms' },
  // ECE
  { id: 'R21-ECE-1', code: 'R212111', name: 'Electronic Devices', semester: 3, credits: 3, department: 'ECE', description: 'Semiconductor physics' },
  { id: 'R21-ECE-2', code: 'R212211', name: 'Signal Processing', semester: 4, credits: 3, department: 'ECE', description: 'Signals analysis' },
  { id: 'R21-ECE-3', code: 'R213111', name: 'Antennas', semester: 5, credits: 3, department: 'ECE', description: 'Antenna Wave Propagation' },
  { id: 'R21-ECE-4', code: 'R213211', name: 'VLSI Design', semester: 6, credits: 3, department: 'ECE', description: 'IC Design' },
  // EEE
  { id: 'R21-EEE-1', code: 'R212121', name: 'Circuit Theory', semester: 3, credits: 3, department: 'EEE', description: 'Circuit analysis' },
  { id: 'R21-EEE-2', code: 'R212221', name: 'Electrical Machines-II', semester: 4, credits: 3, department: 'EEE', description: 'AC Machines' },
  { id: 'R21-EEE-3', code: 'R213121', name: 'Power Electronics', semester: 5, credits: 3, department: 'EEE', description: 'Power semiconductor devices' },
  { id: 'R21-EEE-4', code: 'R213221', name: 'Power System Protection', semester: 6, credits: 3, department: 'EEE', description: 'Relays and Circuit Breakers' },
  // MECH
  { id: 'R21-MECH-1', code: 'R212131', name: 'Material Science', semester: 3, credits: 3, department: 'MECH', description: 'Structure of materials' },
  { id: 'R21-MECH-2', code: 'R212231', name: 'Kinematics of Machinery', semester: 4, credits: 3, department: 'MECH', description: 'Linkages, Cams, Gears' },
  { id: 'R21-MECH-3', code: 'R213131', name: 'Dynamics of Machinery', semester: 5, credits: 3, department: 'MECH', description: 'Forces in machines' },
  { id: 'R21-MECH-4', code: 'R213231', name: 'CAD/CAM', semester: 6, credits: 3, department: 'MECH', description: 'Computer Aided Design' },
  // CIVIL
  { id: 'R21-CIVIL-1', code: 'R212141', name: 'Fluid Mechanics', semester: 3, credits: 3, department: 'CIVIL', description: 'Fluid properties' },
  { id: 'R21-CIVIL-2', code: 'R212241', name: 'Hydraulics', semester: 4, credits: 3, department: 'CIVIL', description: 'Open channel flow' },
  { id: 'R21-CIVIL-3', code: 'R213141', name: 'Soil Mechanics', semester: 5, credits: 3, department: 'CIVIL', description: 'Soil properties' },
  { id: 'R21-CIVIL-4', code: 'R213241', name: 'Foundation Engineering', semester: 6, credits: 3, department: 'CIVIL', description: 'Shallow/Deep foundations' },

  // ========================================
  // R20 REGULATION - EXPANDED (Sem 3-8)
  // ========================================
  // CSE
  { id: 'R20-CSE-S3-1', code: 'R202101', name: 'Data Structures', semester: 3, credits: 3, department: 'CSE', description: 'DS Implementation' },
  { id: 'R20-CSE-S3-2', code: 'R202102', name: 'Obj Oriented Prog', semester: 3, credits: 3, department: 'CSE', description: 'Java OOP' },
  { id: 'R20-CSE-S4-1', code: 'R202201', name: 'Operating Systems', semester: 4, credits: 3, department: 'CSE', description: 'OS Concepts' },
  { id: 'R20-CSE-S4-2', code: 'R202202', name: 'Database Systems', semester: 4, credits: 3, department: 'CSE', description: 'DBMS SQL' },
  { id: 'R20-CSE-1', code: 'R203101', name: 'Web Technologies', semester: 5, credits: 3, department: 'CSE', description: 'Web Dev' },
  { id: 'R20-CSE-2', code: 'R203201', name: 'Data Mining', semester: 6, credits: 3, department: 'CSE', description: 'KDD knowledge' },
  { id: 'R20-CSE-3', code: 'R204101', name: 'Cloud Computing', semester: 7, credits: 3, department: 'CSE', description: 'Cloud services' },
  { id: 'R20-CSE-4', code: 'R204201', name: 'Project Work', semester: 8, credits: 10, department: 'CSE', description: 'Major Project' },
  // ECE
  { id: 'R20-ECE-S3-1', code: 'R202111', name: 'Electronic Devices', semester: 3, credits: 3, department: 'ECE', description: 'Semiconductors' },
  { id: 'R20-ECE-S3-2', code: 'R202112', name: 'Network Analysis', semester: 3, credits: 3, department: 'ECE', description: 'KCL KVL' },
  { id: 'R20-ECE-S4-1', code: 'R202211', name: 'Analog Circuits', semester: 4, credits: 3, department: 'ECE', description: 'Amplifiers' },
  { id: 'R20-ECE-S4-2', code: 'R202212', name: 'Signals & Systems', semester: 4, credits: 3, department: 'ECE', description: 'Fourier Transforms' },
  { id: 'R20-ECE-1', code: 'R203111', name: 'Linear IC Applications', semester: 5, credits: 3, department: 'ECE', description: 'Op-Amps' },
  { id: 'R20-ECE-2', code: 'R203211', name: 'Digital Signal Processing', semester: 6, credits: 3, department: 'ECE', description: 'DSP Algorithms' },
  { id: 'R20-ECE-3', code: 'R204111', name: 'Microwave Engineering', semester: 7, credits: 3, department: 'ECE', description: 'Microwaves' },
  { id: 'R20-ECE-4', code: 'R204211', name: 'Project Work', semester: 8, credits: 10, department: 'ECE', description: 'Major Project' },
  // EEE
  { id: 'R20-EEE-S3-1', code: 'R202121', name: 'Electrical Circuits', semester: 3, credits: 3, department: 'EEE', description: 'Network Theorems' },
  { id: 'R20-EEE-S3-2', code: 'R202122', name: 'EM-I', semester: 3, credits: 3, department: 'EEE', description: 'DC Machines' },
  { id: 'R20-EEE-S4-1', code: 'R202221', name: 'EM-II', semester: 4, credits: 3, department: 'EEE', description: 'AC Machines' },
  { id: 'R20-EEE-S4-2', code: 'R202222', name: 'Power Systems-I', semester: 4, credits: 3, department: 'EEE', description: 'Generation' },
  { id: 'R20-EEE-1', code: 'R203121', name: 'Power Systems-II', semester: 5, credits: 3, department: 'EEE', description: 'Transmission Lines' },
  { id: 'R20-EEE-2', code: 'R203221', name: 'Microprocessors', semester: 6, credits: 3, department: 'EEE', description: 'MPMC' },
  { id: 'R20-EEE-3', code: 'R204121', name: 'HVDCT', semester: 7, credits: 3, department: 'EEE', description: 'High Voltage DC' },
  { id: 'R20-EEE-4', code: 'R204221', name: 'Project Work', semester: 8, credits: 10, department: 'EEE', description: 'Major Project' },
  // MECH
  { id: 'R20-MECH-S3-1', code: 'R202131', name: 'Thermodynamics', semester: 3, credits: 3, department: 'MECH', description: 'Laws of Thermo' },
  { id: 'R20-MECH-S3-2', code: 'R202132', name: 'Mechanics of Solids', semester: 3, credits: 3, department: 'MECH', description: 'Stress Strain' },
  { id: 'R20-MECH-S4-1', code: 'R202231', name: 'Fluid Mechanics', semester: 4, credits: 3, department: 'MECH', description: 'Fluid Dynamics' },
  { id: 'R20-MECH-S4-2', code: 'R202232', name: 'Production Tech', semester: 4, credits: 3, department: 'MECH', description: 'Manufacturing' },
  { id: 'R20-MECH-1', code: 'R203131', name: 'Machine Tools', semester: 5, credits: 3, department: 'MECH', description: 'Lathe, Milling' },
  { id: 'R20-MECH-2', code: 'R203231', name: 'Heat Transfer', semester: 6, credits: 3, department: 'MECH', description: 'Conduction, Convection' },
  { id: 'R20-MECH-3', code: 'R204131', name: 'Finite Element Methods', semester: 7, credits: 3, department: 'MECH', description: 'FEM Analysis' },
  { id: 'R20-MECH-4', code: 'R204231', name: 'Project Work', semester: 8, credits: 10, department: 'MECH', description: 'Major Project' },
  // CIVIL
  { id: 'R20-CIVIL-S3-1', code: 'R202141', name: 'Surveying', semester: 3, credits: 3, department: 'CIVIL', description: 'Surveying' },
  { id: 'R20-CIVIL-S3-2', code: 'R202142', name: 'Strength of Materials', semester: 3, credits: 3, department: 'CIVIL', description: 'SOM' },
  { id: 'R20-CIVIL-S4-1', code: 'R202241', name: 'Hydraulics', semester: 4, credits: 3, department: 'CIVIL', description: 'Fluid Mech' },
  { id: 'R20-CIVIL-S4-2', code: 'R202242', name: 'Building Planning', semester: 4, credits: 3, department: 'CIVIL', description: 'Building Drawing' },
  { id: 'R20-CIVIL-1', code: 'R203141', name: 'Structural Analysis-II', semester: 5, credits: 3, department: 'CIVIL', description: 'Advanced structures' },
  { id: 'R20-CIVIL-2', code: 'R203241', name: 'Geotechnical Engineering-II', semester: 6, credits: 3, department: 'CIVIL', description: 'Foundation design' },
  { id: 'R20-CIVIL-3', code: 'R204141', name: 'Remote Sensing', semester: 7, credits: 3, department: 'CIVIL', description: 'GIS and RS' },
  { id: 'R20-CIVIL-4', code: 'R204241', name: 'Project Work', semester: 8, credits: 10, department: 'CIVIL', description: 'Major Project' },
];

export default function Syllabus() {
  const { user, userRole } = useAuth();

  const isAdmin = userRole === 'admin';
  const isTeacher = userRole === 'teacher';

  const { data: courses, isLoading: loadingCourses } = useCourses();
  const { data: classes } = useClasses();
  const { data: assignments } = useAssignments();
  const { data: submissions } = useSubmissions(user?.id);

  const [expandedCourses, setExpandedCourses] = useState<string[]>([]);
  const [selectedRegulation, setSelectedRegulation] = useState('R23');
  const [selectedBranch, setSelectedBranch] = useState('CSE');
  const [selectedYear, setSelectedYear] = useState('All');

  // const { mutate: seedDatabase, isPending: isSeeding } = useSeedDatabase();

  // const handleSeed = () => {
  //   toast.info("Starting database seed...");
  //   seedDatabase(undefined, {
  //     onSuccess: (data) => {
  //       toast.success(`Data loaded! Added ${data.courses} courses.`);
  //       // Force reload or let React Query handle invalidation
  //     },
  //     onError: (err) => {
  //       toast.error("Failed to seed: " + err.message);
  //     }
  //   });
  // };

  // Filter courses based on Regulation and Branch
  const filteredCourses = useMemo(() => {

    // Helper: Filtering Logic
    const getFiltered = (sourceData: any[]) => {
      return sourceData.filter((course: any) => {
        // 1. Regulation Filter
        const regulationMatch = (course.regulation === selectedRegulation) || course.code?.startsWith(selectedRegulation);

        // 2. Branch Filter
        const commonDepartments = ['Basic Science', 'Humanities', 'Engineering Science', 'Management'];
        const isCommonSubject = commonDepartments.includes(course.department || '');
        const isBranchSubject = course.department === selectedBranch;

        // 3. Year Filter
        let yearMatch = true;
        if (selectedYear === 'I') yearMatch = [1, 2].includes(course.semester);
        else if (selectedYear === 'II') yearMatch = [3, 4].includes(course.semester);
        else if (selectedYear === 'III') yearMatch = [5, 6].includes(course.semester);
        else if (selectedYear === 'IV') yearMatch = [7, 8].includes(course.semester);

        return regulationMatch && (isCommonSubject || isBranchSubject) && yearMatch;
      });
    };

    // Strategy 1: Try filtering from API courses first
    if (courses && courses.length > 0) {
      const apiResults = getFiltered(courses);
      // If we found matches in the DB, use them (Single Source of Truth)
      if (apiResults.length > 0) {
        return apiResults;
      }
      // If DB has data but NOTHING for this selection (e.g. DB has only R23, user selected R20),
      // Fall through to Strategy 2 (Fallback Data)
    }

    // Strategy 2: Use internal JNTUGV_DATA Fallback
    // This allows users to see R20/R21 data even if they only seeded R23
    return getFiltered(JNTUGV_DATA);

  }, [courses, selectedRegulation, selectedBranch, selectedYear]);

  // Calculate course progress based on completed assignments
  const courseProgress = useMemo(() => {
    if (!filteredCourses || !assignments || !submissions) return {};

    const progress: Record<string, { completed: number; total: number; percentage: number }> = {};

    filteredCourses.forEach(course => {
      const courseClasses = classes?.filter(c => c.course_id === course.id) || [];
      const classIds = courseClasses.map(c => c.id);

      const courseAssignments = assignments.filter(a => classIds.includes(a.class_id));
      const completedAssignments = courseAssignments.filter(a =>
        submissions?.some(s => s.assignment_id === a.id && s.marks !== null)
      );

      const total = courseAssignments.length;
      const completed = completedAssignments.length;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

      progress[course.id] = { completed, total, percentage };
    });

    return progress;
  }, [filteredCourses, classes, assignments, submissions]);

  const toggleCourse = (courseId: string) => {
    setExpandedCourses(prev =>
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  if (loadingCourses) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  /* ----------------------------------------------------------------------------------
   *  LIVE CLASS LOGIC
   * ---------------------------------------------------------------------------------- */
  const { data: timetable } = useTimetable(user?.id); // Fetch student timetable
  const [currentSlotMatches, setCurrentSlotMatches] = useState<string[]>([]);

  // Update Live Status every minute
  useState(() => {
    const checkLiveStatus = () => {
      if (!timetable) return;

      const now = new Date();
      const options = { weekday: 'long' } as const;
      const currentDay = new Intl.DateTimeFormat('en-US', options).format(now);
      const currentTime = now.getHours() * 60 + now.getMinutes();

      const activeSubjects: string[] = [];

      timetable.forEach((slot: any) => {
        if (slot.day_of_week !== currentDay) return;

        // Parse "10:30" to minutes
        const parseTime = (t: string) => {
          const [h, m] = t.split(':').map(Number);
          return h * 60 + m;
        };

        const start = parseTime(slot.start_time);
        const end = parseTime(slot.end_time);

        if (currentTime >= start && currentTime < end) {
          // Find the course ID linking to this slot
          // We might need to match by course code or id
          // Assuming slot has course_id or we match by code from our courses list
          const matchedCourse = courses?.find(c => c.code === slot.subject_code || c.id === slot.class_id || c.name === slot.subject_name);
          if (matchedCourse) {
            activeSubjects.push(matchedCourse.id);
          }
          // Fallback for JNTU Data matching if DB match fails (using code)
          const jntuMatch = JNTUGV_DATA.find(c => c.code === slot.subject_code);
          if (jntuMatch) activeSubjects.push(jntuMatch.id);
        }
      });

      setCurrentSlotMatches(activeSubjects);
    };

    const interval = setInterval(checkLiveStatus, 60000); // Check every minute
    checkLiveStatus(); // Initial check

    return () => clearInterval(interval);
  }, [timetable, courses]);

  // Set defaults from Profile
  useState(() => {
    if (user && (user as any).regulation) {
      setSelectedRegulation((user as any).regulation);
    }
    if (user && (user as any).department) {
      // Map department names if necessary, e.g. "Computer Science" -> "CSE"
      // Promoting simple mapping for now
      const deptMap: Record<string, string> = {
        'Computer Science': 'CSE',
        'Electronics': 'ECE',
        'Electrical': 'EEE',
        'Mechanical': 'MECH',
        'Civil': 'CIVIL',
        'CSE': 'CSE',
        'ECE': 'ECE',
        'EEE': 'EEE',
        'MECH': 'MECH',
        'CIVIL': 'CIVIL'
      };
      const mappedDept = deptMap[(user as any).department];
      if (mappedDept) setSelectedBranch(mappedDept);
    }
    if (user && (user as any).year) {
      // Assuming user.year is "III", "2", etc.
      // Normalize if needed.
    }
  }, [user]);

  return (
    <DashboardLayout>
      <div className="space-y-6 stagger-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">Syllabus</h1>
            <p className="text-muted-foreground">
              {isTeacher ? 'Manage course syllabi and content' : 'Track your course progress and content'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={selectedRegulation} onValueChange={setSelectedRegulation}>
              <SelectTrigger className="w-[180px] glass-card">
                <SelectValue placeholder="Regulation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="R23">R23 Regulation</SelectItem>
                <SelectItem value="R22">R22 Regulation</SelectItem>
                <SelectItem value="R21">R21 Regulation</SelectItem>
                <SelectItem value="R20">R20 Regulation</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="w-[180px] glass-card">
                <SelectValue placeholder="Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CSE">CSE</SelectItem>
                <SelectItem value="ECE">ECE</SelectItem>
                <SelectItem value="EEE">EEE</SelectItem>
                <SelectItem value="MECH">Mechanical</SelectItem>
                <SelectItem value="CIVIL">Civil</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[140px] glass-card">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Years</SelectItem>
                <SelectItem value="I">I Year</SelectItem>
                <SelectItem value="II">II Year</SelectItem>
                <SelectItem value="III">III Year</SelectItem>
                <SelectItem value="IV">IV Year</SelectItem>
              </SelectContent>
            </Select>
          </div>



          {isAdmin && <AddSubjectDialog />}

        </div>
        {/* Progress Overview */}
        {filteredCourses && filteredCourses.length > 0 ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {filteredCourses.slice(0, 4).map((course) => {
                const progress = courseProgress[course.id] || { completed: 0, total: 0, percentage: 0 };
                return (
                  <Card
                    key={course.id}
                    className="shadow-card hover:shadow-card-hover transition-shadow cursor-pointer"
                    onClick={() => toggleCourse(course.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <BookOpen className="h-5 w-5 text-primary" />
                        <div className="flex gap-2">
                          {currentSlotMatches.includes(course.id) && (
                            <Badge variant="destructive" className="animate-pulse shadow-red-200 shadow-md">
                              🔴 Live Now
                            </Badge>
                          )}
                          <Badge variant={progress.percentage >= 70 ? "default" : progress.percentage >= 40 ? "secondary" : "outline"} className="shadow-sm">
                            {progress.percentage}%
                          </Badge>
                        </div>
                      </div>
                      <h3 className="font-display font-bold text-lg mb-1 truncate group-hover:text-primary transition-colors">{course.name}</h3>
                      <p className="text-sm text-muted-foreground">{course.credits} Credits • Sem {course.semester}</p>
                      <Progress value={progress.percentage} className="h-2 mt-3" />
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Detailed Syllabus */}
            <div className="space-y-4">
              {filteredCourses.map((course) => {
                const progress = courseProgress[course.id] || { completed: 0, total: 0, percentage: 0 };
                const courseClasses = classes?.filter(c => c.course_id === course.id) || [];
                const classIds = courseClasses.map(c => c.id);
                const courseAssignments = assignments?.filter(a => classIds.includes(a.class_id)) || [];

                return (
                  <Card key={course.id} className="glass-card overflow-hidden transition-all duration-300">
                    <CardHeader
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => toggleCourse(course.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {expandedCourses.includes(course.id) ? (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          )}
                          <div>
                            <CardTitle className="font-display font-bold text-lg">{course.name}</CardTitle>
                            <CardDescription>
                              {course.code} • {course.credits} Credits • Semester {course.semester}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium">{progress.percentage}% Complete</p>
                            <Progress value={progress.percentage} className="h-2 w-24" />
                          </div>

                        </div>
                      </div>
                    </CardHeader>

                    {expandedCourses.includes(course.id) && (
                      <CardContent className="pt-0">
                        {(course as any).units ? (
                          <div className="space-y-4 mb-6">
                            {(course as any).units.map((unit: any, index: number) => (
                              <div key={index} className="space-y-1">
                                <h4 className="font-semibold text-primary">{unit.title}</h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">{unit.content}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          course.description && (
                            <p className="text-muted-foreground mb-4">{course.description}</p>
                          )
                        )}

                        <div className="flex justify-start mb-6">
                          <Button variant="outline" size="sm" asChild>
                            <a href="https://jntugv.edu.in/syllabus" target="_blank" rel="noopener noreferrer">
                              <BookOpen className="h-4 w-4 mr-2" />
                              View Official Syllabus (External)
                            </a>
                          </Button>
                        </div>

                        {courseAssignments.length > 0 ? (
                          <div className="space-y-4">
                            <h4 className="font-semibold">Assignments & Assessments</h4>
                            {courseAssignments.map((assignment) => {
                              const hasSubmission = submissions?.some(s =>
                                s.assignment_id === assignment.id && s.marks !== null
                              );

                              return (
                                <div key={assignment.id} className={cn(
                                  "p-4 rounded-xl border transition-all hover:bg-muted/40",
                                  hasSubmission ? "bg-success/5 border-success/20" : "bg-card/50"
                                )}>
                                  <div className="flex items-center gap-3">
                                    {hasSubmission ? (
                                      <CheckCircle className="h-5 w-5 text-success" />
                                    ) : (
                                      <Circle className="h-5 w-5 text-muted-foreground" />
                                    )}
                                    <div className="flex-1">
                                      <h5 className="font-semibold">{assignment.title}</h5>
                                      {assignment.description && (
                                        <p className="text-sm text-muted-foreground">{assignment.description}</p>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      <Badge variant="outline">{assignment.max_marks} marks</Badge>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-center py-4">
                            No assignments available for this course
                          </p>
                        )}
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </>
        ) : (
          <Card className="shadow-card">
            <CardContent className="p-8 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No courses available for {selectedRegulation} - {selectedBranch}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout >
  );
}
