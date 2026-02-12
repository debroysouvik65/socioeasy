const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const { Strategy: LocalStrategy } = require('passport-local');
const bcrypt = require('bcryptjs');
const db = require('./database');

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
};

passport.use(new JwtStrategy(jwtOptions, async (payload, done) => {
  try {
    const user = await db('users').where({ id: payload.sub, active: true }).first();
    return user ? done(null, user) : done(null, false);
  } catch (error) {
    return done(error, false);
  }
}));

passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
  try {
    const user = await db('users').where({ email }).first();
    if (!user || !await bcrypt.compare(password, user.password_hash)) {
      return done(null, false, { message: 'Invalid credentials' });
    }
    await db('users').where({ id: user.id }).update({ last_login: new Date() });
    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

module.exports = passport;
