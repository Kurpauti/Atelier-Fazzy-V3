document.addEventListener('pointerdown', function(e) {
  const square = document.createElement('div');
  square.className = 'square-effect';
  square.style.left = `${e.pageX}px`;
  square.style.top = `${e.pageY}px`;

  document.body.appendChild(square);

  square.addEventListener('animationend', () => {
    square.remove();
  });
});