let particles = [];

class Particle {
  constructor(x, y, color) {
    this.x = x; this.y = y;
    this.vx = random(-5, 5);
    this.vy = random(-5, 5);
    this.life = 255;
    this.color = color; // [r, g, b]
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= 10;
  }

  show() {
    noStroke();
    fill(this.color[0], this.color[1], this.color[2], this.life);
    circle(this.x, this.y, 8);
  }
}

function spawnExplosion(x, y, color) {
  for (let i = 0; i < 20; i++) {
    particles.push(new Particle(x, y, color));
  }
}

function drawParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].show();
    if (particles[i].life <= 0) {
      particles.splice(i, 1);
    }
  }
}
