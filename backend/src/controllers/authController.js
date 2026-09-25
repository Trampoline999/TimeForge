import prisma from '../config/prisma.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-intelligent-timetable-jwt-key-2026';

export async function getCurrentUser(req, res) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      // Default to Super Admin for seamless development experience
      const defaultAdmin = await prisma.user.findFirst({
        where: { role: 'SUPER_ADMIN' },
        include: { department: true, faculty: true },
      });
      return res.json({ user: defaultAdmin });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { department: true, faculty: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired session' });
  }
}

export async function listUsers(req, res) {
  try {
    const users = await prisma.user.findMany({
      include: { department: true, faculty: true },
      orderBy: { role: 'asc' },
    });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function switchUser(req, res) {
  try {
    const { userId } = req.body;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { department: true, faculty: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ user, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function googleOAuthLogin(req, res) {
  try {
    const { email, name, collegeDomain = 'college.edu' } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // College Domain Restriction check
    if (!email.endsWith(`@${collegeDomain}`)) {
      return res.status(403).json({
        error: `Login rejected: Only official college accounts (@${collegeDomain}) are authorized.`,
      });
    }

    let user = await prisma.user.findUnique({
      where: { email },
      include: { department: true, faculty: true },
    });

    if (!user) {
      // Find matching faculty by email if exists
      const matchingFaculty = await prisma.faculty.findUnique({
        where: { email },
      });

      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          role: matchingFaculty ? 'FACULTY' : 'STUDENT',
          departmentId: matchingFaculty?.departmentId || null,
          facultyId: matchingFaculty?.id || null,
        },
        include: { department: true, faculty: true },
      });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ user, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
