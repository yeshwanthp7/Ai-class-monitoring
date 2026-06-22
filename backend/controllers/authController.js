import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { isConnected } from '../config/db.js';
import bcrypt from 'bcryptjs';

// In-memory simulated database fallback
const memoryUsers = [];

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'jwt_secret_key_12345', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    if (isConnected) {
      const userExists = await User.findOne({ email });

      if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const user = await User.create({
        name,
        email,
        password,
        role,
      });

      if (user) {
        return res.status(201).json({
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: generateToken(user._id),
        });
      } else {
        return res.status(400).json({ message: 'Invalid user data' });
      }
    } else {
      // In-memory fallback
      const userExists = memoryUsers.find((u) => u.email === email);
      if (userExists) {
        return res.status(400).json({ message: 'User already exists (Simulated DB)' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = {
        _id: String(memoryUsers.length + 1),
        name,
        email,
        password: hashedPassword,
        role,
      };

      memoryUsers.push(user);

      return res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const authUser = async (req, res) => {
  const { email, password, role } = req.body;

  try {
    if (isConnected) {
      const user = await User.findOne({ email });

      if (user && (await user.matchPassword(password))) {
        if (user.role !== role) {
          return res.status(401).json({ message: `Access denied. You are registered as a ${user.role}.` });
        }

        return res.json({
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: generateToken(user._id),
        });
      } else {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
    } else {
      // In-memory validation
      const user = memoryUsers.find((u) => u.email === email);
      if (user && (await bcrypt.compare(password, user.password))) {
        if (user.role !== role) {
          return res.status(401).json({ message: `Access denied. You are registered as a ${user.role}.` });
        }

        return res.json({
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: generateToken(user._id),
        });
      } else {
        return res.status(401).json({ message: 'Invalid email or password (Simulated DB)' });
      }
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
