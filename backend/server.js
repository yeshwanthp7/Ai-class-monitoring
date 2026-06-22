import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// In-memory database of rooms
const rooms = {};

// Helper to generate dynamic academic slides for any topic
function generateLessonContent(topic) {
  const normalized = topic.toLowerCase().trim();
  
  if (normalized.includes('photosynthesis')) {
    return {
      topic: "Photosynthesis & Cellular Energy",
      slides: [
        {
          title: "Introduction to Photosynthesis",
          bullets: [
            "Process by which green plants, algae, and some bacteria convert light energy into chemical energy.",
            "Occurs primarily inside the chloroplasts of plant cells.",
            "Formulates the foundation of life on Earth by generating oxygen and organic carbon compounds."
          ],
          diagramType: "photosynthesis-intro"
        },
        {
          title: "The Chemical Equation",
          bullets: [
            "6CO₂ + 6H₂O + Light Energy ➔ C₆H₁₂O₆ + 6O₂",
            "Carbon dioxide is absorbed through leaf pores called stomata.",
            "Water is taken up by root systems and transported via xylem vessels.",
            "Glucose (C₆H₁₂O₆) serves as active cellular fuel."
          ],
          diagramType: "photosynthesis-equation"
        },
        {
          title: "Light-Dependent Reactions",
          bullets: [
            "Takes place in the thylakoid membranes inside the chloroplast.",
            "Chlorophyll pigments absorb solar photons, energizing electrons.",
            "Splits water molecules (photolysis) to release protons and oxygen gas.",
            "Produces high-energy carriers: ATP and NADPH."
          ],
          diagramType: "photosynthesis-light"
        },
        {
          title: "The Calvin Cycle (Light-Independent)",
          bullets: [
            "Takes place in the stroma surrounding the thylakoids.",
            "Does not require direct sunlight, but utilizes ATP and NADPH from the light reactions.",
            "Fixes carbon dioxide molecules using the enzyme RuBisCO.",
            "Converts carbon into 3-carbon sugars, eventually synthesizing glucose."
          ],
          diagramType: "photosynthesis-calvin"
        }
      ],
      aiScript: "Welcome students to today's session on photosynthesis. Today, we will discuss how plants capture solar radiation to manufacture food. In our first slide, we see that photosynthesis occurs in leaf chloroplasts, driven by green chlorophyll pigments. Moving on, the chemical formula tells us that six molecules of carbon dioxide and six molecules of water combine under sunlight to produce glucose and release oxygen. There are two primary phases: the light-dependent reactions which split water molecules in the thylakoids to create energy carriers, and the Calvin Cycle which occurs in the stroma to fix carbon dioxide into sugars. Please review the slides and pay attention as we will verify your focus levels."
    };
  } else if (normalized.includes('quantum') || normalized.includes('computing') || normalized.includes('physics')) {
    return {
      topic: "Fundamentals of Quantum Computing",
      slides: [
        {
          title: "What is Quantum Computing?",
          bullets: [
            "A paradigm that utilizes quantum mechanical properties to compute complex calculations.",
            "Solves specific algorithms exponentially faster than classical supercomputers.",
            "Based on the core principles of quantum physics: superposition and entanglement."
          ],
          diagramType: "quantum-intro"
        },
        {
          title: "Qubits vs. Classical Bits",
          bullets: [
            "Classical bits are strictly binary: representing either 0 or 1.",
            "Quantum bits (qubits) can exist in a superposition of both 0 and 1 simultaneously.",
            "Enables parallel processing of huge mathematical dimensions."
          ],
          diagramType: "quantum-qubits"
        },
        {
          title: "Superposition & Entanglement",
          bullets: [
            "Superposition: Qubits exist in a linear combination of states until measured.",
            "Entanglement: Multi-qubit correlations where one qubit's state instantly determines another's, regardless of physical distance.",
            "Enables highly synchronized operations across register structures."
          ],
          diagramType: "quantum-entanglement"
        },
        {
          title: "Quantum Algorithms & Applications",
          bullets: [
            "Shor's Algorithm: Factors large integers efficiently, threatening classical RSA encryption.",
            "Grover's Algorithm: Searches unsorted databases quadratically faster.",
            "Key applications include molecular modeling for drug discovery and logistics optimizations."
          ],
          diagramType: "quantum-algorithms"
        }
      ],
      aiScript: "Hello class. Today we explore quantum computing. Unlike traditional computers that process sequences of zeros and ones, quantum computers leverage the strange laws of quantum mechanics. Specifically, superposition allows qubits to represent zero and one at the same time, expanding computation capacity exponentially. Entanglement links qubits together so that a change in one instantly dictates the state of another. This allows us to perform massive parallel computations and run specialized algorithms like Shor's algorithm for factoring, or Grover's algorithm for database searches."
    };
  } else {
    const capitalizedTopic = topic.charAt(0).toUpperCase() + topic.slice(1);
    return {
      topic: capitalizedTopic,
      slides: [
        {
          title: `Introduction to ${capitalizedTopic}`,
          bullets: [
            `Comprehensive exploration of the core concepts surrounding ${capitalizedTopic}.`,
            `Analyzes structural foundations, functional rules, and core components.`,
            `Essential for mastering advanced methodologies in this academic field.`
          ],
          diagramType: "generic-intro"
        },
        {
          title: "Core Mechanics & Principles",
          bullets: [
            "Key operational dynamics that drive the subject's behavior.",
            "Logical inputs, structural dependencies, and mechanical pathways.",
            "Common methodologies applied to compile or construct these systems."
          ],
          diagramType: "generic-mechanics"
        },
        {
          title: "Practical Implementations",
          bullets: [
            "Real-world case studies demonstrating effective utilization.",
            "Solves key engineering, economic, or scientific challenges in modern research.",
            "Optimizes speed, reliability, and precision of operations."
          ],
          diagramType: "generic-applications"
        },
        {
          title: "Summary & Open Inquiries",
          bullets: [
            "Recap of foundational rules and essential process connections.",
            "Overview of current technical limitations and areas for future optimization.",
            "Open review for students to test their comprehension indices."
          ],
          diagramType: "generic-summary"
        }
      ],
      aiScript: `Welcome class. Today we are conducting an active lecture on ${capitalizedTopic}. Over the next few slides, we will cover the introduction, investigate the core mechanics and operational principles, review real-world practical implementations, and summarize the key takeaways. Please focus your attention on the screen and ensure you remain fully attentive throughout the lecture.`
    };
  }
}

// Routes
app.use('/api/auth', authRoutes);

// Room Create (Teacher)
app.post('/api/rooms', (req, res) => {
  const { roomId, teacherEmail, topic } = req.body;
  if (!roomId || !teacherEmail || !topic) {
    return res.status(400).json({ message: 'Room ID, teacher email, and topic are required' });
  }

  const lesson = generateLessonContent(topic);
  
  rooms[roomId] = {
    roomId,
    teacherEmail,
    topic: lesson.topic,
    originalTopic: topic,
    slides: lesson.slides,
    aiScript: lesson.aiScript,
    currentSlideIndex: 0,
    students: {},
    createdAt: new Date()
  };

  res.status(201).json(rooms[roomId]);
});

// Get Room Info
app.get('/api/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;
  const room = rooms[roomId];
  if (!room) {
    return res.status(404).json({ message: 'Meeting room not found' });
  }
  res.json(room);
});

// Update Topic (Teacher updates lesson during meeting)
app.post('/api/rooms/:roomId/update-topic', (req, res) => {
  const { roomId } = req.params;
  const { topic } = req.body;
  const room = rooms[roomId];
  if (!room) {
    return res.status(404).json({ message: 'Room not found' });
  }
  if (!topic) {
    return res.status(400).json({ message: 'Topic is required' });
  }

  const lesson = generateLessonContent(topic);
  room.topic = lesson.topic;
  room.originalTopic = topic;
  room.slides = lesson.slides;
  room.aiScript = lesson.aiScript;
  room.currentSlideIndex = 0; // reset to beginning

  res.json(room);
});

// Change Active Slide (Teacher changes active page slide)
app.post('/api/rooms/:roomId/slide', (req, res) => {
  const { roomId } = req.params;
  const { index } = req.body;
  const room = rooms[roomId];
  if (!room) {
    return res.status(404).json({ message: 'Room not found' });
  }
  if (index === undefined || index < 0 || index >= room.slides.length) {
    return res.status(400).json({ message: 'Invalid slide index' });
  }

  room.currentSlideIndex = index;
  res.json({ currentSlideIndex: room.currentSlideIndex });
});

// Join Room (Student)
app.post('/api/rooms/:roomId/join', (req, res) => {
  const { roomId } = req.params;
  const { studentEmail, studentName } = req.body;
  const room = rooms[roomId];
  if (!room) {
    return res.status(404).json({ message: 'Meeting room not found' });
  }
  if (!studentEmail || !studentName) {
    return res.status(400).json({ message: 'Student details are required' });
  }

  room.students[studentEmail] = {
    email: studentEmail,
    name: studentName,
    lastActive: new Date(),
    state: 'Attentive',
    engagementScore: 100,
    isCameraOn: true,
    isMicOn: true
  };

  res.json(room);
});

// Update Student Engagement (Computer Vision Telemetry data)
app.post('/api/rooms/:roomId/engage', (req, res) => {
  const { roomId } = req.params;
  const { studentEmail, state, engagementScore, isCameraOn, isMicOn } = req.body;
  const room = rooms[roomId];
  if (!room) {
    return res.status(404).json({ message: 'Room not found' });
  }
  if (!studentEmail || !room.students[studentEmail]) {
    return res.status(404).json({ message: 'Student is not joined in this room' });
  }

  const student = room.students[studentEmail];
  student.state = state || student.state;
  student.engagementScore = engagementScore !== undefined ? engagementScore : student.engagementScore;
  student.isCameraOn = isCameraOn !== undefined ? isCameraOn : student.isCameraOn;
  student.isMicOn = isMicOn !== undefined ? isMicOn : student.isMicOn;
  student.lastActive = new Date();

  res.json({ success: true, student: student });
});

// Poll student engagement list (Teacher Dashboard pulls this in)
app.get('/api/rooms/:roomId/engage', (req, res) => {
  const { roomId } = req.params;
  const room = rooms[roomId];
  if (!room) {
    return res.status(404).json({ message: 'Room not found' });
  }
  res.json({
    roomId: room.roomId,
    topic: room.topic,
    currentSlideIndex: room.currentSlideIndex,
    students: Object.values(room.students)
  });
});

// Base Route
app.get('/', (req, res) => {
  res.send('AI Teaching Assistant API is running...');
});

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
