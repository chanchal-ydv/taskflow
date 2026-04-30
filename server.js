require('dotenv').config();
const express = require('express');
const mongoose = require('express');
const mongooseDb = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

mongooseDb.connect(process.env.MONGO_URI)
  .then(() => console.log('DB Connected'))
  .catch(err => console.log(err));

const UserSchema = new mongooseDb.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'Member'], default: 'Member' }
});
const User = mongooseDb.model('User', UserSchema);

const ProjectSchema = new mongooseDb.Schema({
  name: { type: String, required: true },
  description: String
});
const Project = mongooseDb.model('Project', ProjectSchema);

const TaskSchema = new mongooseDb.Schema({
  title: { type: String, required: true },
  description: String,
  status: { type: String, enum: ['Pending', 'In Progress', 'Completed', 'Overdue'], default: 'Pending' },
  dueDate: { type: Date, required: true },
  project: { type: mongooseDb.Schema.Types.ObjectId, ref: 'Project' },
  assignedTo: { type: mongooseDb.Schema.Types.ObjectId, ref: 'User' }
});
const Task = mongooseDb.model('Task', TaskSchema);

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ error: 'Access denied' });
  try {
    const verified = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Admin only' });
  next();
};

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = new User({ name, email, password: hashedPassword, role });
    await user.save();
    res.status(201).json({ message: 'User registered' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'User not found' });
    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) return res.status(400).json({ error: 'Invalid password' });
    const token = jwt.sign({ _id: user._id, role: user.role }, process.env.JWT_SECRET);
    res.json({ token, role: user.role, name: user.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users', authMiddleware, async (req, res) => {
  const users = await User.find().select('-password');
  res.json(users);
});

app.post('/api/projects', authMiddleware, adminMiddleware, async (req, res) => {
  const project = new Project(req.body);
  await project.save();
  res.status(201).json(project);
});

app.get('/api/projects', authMiddleware, async (req, res) => {
  const projects = await Project.find();
  res.json(projects);
});

app.post('/api/tasks', authMiddleware, adminMiddleware, async (req, res) => {
  const task = new Task(req.body);
  await task.save();
  res.status(201).json(task);
});

app.get('/api/tasks', authMiddleware, async (req, res) => {
  let query = {};
  if (req.user.role === 'Member') query.assignedTo = req.user._id;
  const tasks = await Task.find(query).populate('project').populate('assignedTo', 'name');
  res.json(tasks);
});

app.put('/api/tasks/:id', authMiddleware, async (req, res) => {
  const task = await Task.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  res.json(task);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));