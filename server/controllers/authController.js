const User = require('../models/User');
const {
  generateTokens,
  saveRefreshToken,
  deleteRefreshToken,
  getRefreshToken
} = require('../config/tokens');
const jwt = require('jsonwebtoken');


const setRefreshCookie = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,   
    secure: false,     
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 
  });
};


const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const user = await User.create({ name, email, password });

    const { accessToken, refreshToken } = generateTokens(user._id.toString());

    await saveRefreshToken(user._id.toString(), refreshToken);

    setRefreshCookie(res, refreshToken);

    res.status(201).json({
      message: 'Account created successfully',
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


const login = async (req, res) => {
  try {
    const { email, password } = req.body;


    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }


    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = generateTokens(user._id.toString());

    await saveRefreshToken(user._id.toString(), refreshToken);

    setRefreshCookie(res, refreshToken);

    res.json({
      message: 'Login successful',
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const refresh = async (req, res) => {
  try {

    const token = req.cookies.refreshToken;
    if (!token) {
      return res.status(401).json({ message: 'No refresh token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const storedToken = await getRefreshToken(decoded.userId);
    if (!storedToken || storedToken !== token) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.userId);

    await saveRefreshToken(decoded.userId, newRefreshToken);
    setRefreshCookie(res, newRefreshToken);

    res.json({ accessToken });

  } catch (error) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

const logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      await deleteRefreshToken(decoded.userId);
    }

    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });

  } catch (error) {
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  }
};

module.exports = { register, login, refresh, logout };