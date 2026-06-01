(function () {
  var backTop = document.querySelector('[data-back-top]');
  if (backTop) {
    backTop.addEventListener('click', function (event) {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  document.querySelectorAll('[data-drag-scroll]').forEach(function (scroller) {
    var isDown = false;
    var startX = 0;
    var startScrollLeft = 0;

    scroller.addEventListener('pointerdown', function (event) {
      isDown = true;
      startX = event.clientX;
      startScrollLeft = scroller.scrollLeft;
      scroller.classList.add('is-dragging');
      scroller.setPointerCapture(event.pointerId);
    });

    scroller.addEventListener('pointermove', function (event) {
      if (!isDown) return;
      event.preventDefault();
      scroller.scrollLeft = startScrollLeft - (event.clientX - startX);
    });

    function endDrag(event) {
      if (!isDown) return;
      isDown = false;
      scroller.classList.remove('is-dragging');
      if (event && scroller.hasPointerCapture(event.pointerId)) {
        scroller.releasePointerCapture(event.pointerId);
      }
    }

    scroller.addEventListener('pointerup', endDrag);
    scroller.addEventListener('pointercancel', endDrag);
    scroller.addEventListener('mouseleave', endDrag);
  });

  document.querySelectorAll('[data-tag-sphere]').forEach(function (sphere) {
    var nodes = Array.prototype.slice.call(sphere.querySelectorAll('.tag-sphere-node'));
    if (!nodes.length) return;
    var ringBack = sphere.querySelector('.tag-sphere-ring-back');
    var ringFront = sphere.querySelector('.tag-sphere-ring-front');

    var weights = nodes.map(function (node) {
      return Number(node.getAttribute('data-weight')) || 1;
    });
    var maxWeight = Math.max.apply(Math, weights);

    function setTagSizes() {
      var compact = window.innerWidth < 560;
      var minSize = compact ? 9 : 11;
      var maxSize = compact ? 22 : 34;

      nodes.forEach(function (node, index) {
        var ratio = weights[index] / Math.max(maxWeight, 1);
        var size = minSize + Math.pow(ratio, 0.58) * (maxSize - minSize);
        node.style.setProperty('--tag-size', size.toFixed(1) + 'px');
        node.style.setProperty('--tag-weight-ratio', ratio.toFixed(3));
      });
    }

    var radius = 170;
    var rotationX = -0.22;
    var rotationY = 0.32;
    var autoVelocityY = 0.0022;
    var velocityX = 0;
    var velocityY = autoVelocityY;
    var isDown = false;
    var startX = 0;
    var startY = 0;
    var moved = false;
    var activeLink = null;
    var suppressNextClick = false;
    var ringSpin = 0;
    var ringSpinVelocity = 0;

    var points = nodes.map(function (_, index) {
      var count = nodes.length;
      var y = 1 - (index / Math.max(count - 1, 1)) * 2;
      var radial = Math.sqrt(1 - y * y);
      var theta = index * Math.PI * (3 - Math.sqrt(5));

      return {
        x: Math.cos(theta) * radial,
        y: y,
        z: Math.sin(theta) * radial
      };
    });

    function render() {
      var size = sphere.clientWidth || 320;
      radius = Math.max(108, Math.min(size * 0.38, 172));
      var sinX = Math.sin(rotationX);
      var cosX = Math.cos(rotationX);
      var sinY = Math.sin(rotationY);
      var cosY = Math.cos(rotationY);
      var ringDrift = Math.sin(rotationY) * 18;
      var ringTilt = -13 + ringSpin + Math.sin(rotationX * 1.4) * 8 + Math.cos(rotationY) * 5;
      var ringScale = 0.94 + Math.abs(Math.sin(rotationY)) * 0.12;

      var ringTransform = 'translate(-50%, -50%) translateX(' + ringDrift.toFixed(2) + 'px) rotate(' + ringTilt.toFixed(2) + 'deg) scaleX(' + ringScale.toFixed(3) + ')';
      if (ringBack) {
        ringBack.style.transform = ringTransform;
        ringBack.style.opacity = (0.48 + Math.max(0, Math.cos(rotationY)) * 0.18).toFixed(3);
      }
      if (ringFront) {
        ringFront.style.transform = ringTransform;
        ringFront.style.opacity = (0.68 + Math.max(0, Math.sin(rotationY)) * 0.18).toFixed(3);
      }

      points.forEach(function (point, index) {
        var x1 = point.x * cosY - point.z * sinY;
        var z1 = point.x * sinY + point.z * cosY;
        var y1 = point.y * cosX - z1 * sinX;
        var z2 = point.y * sinX + z1 * cosX;
        var depth = (z2 + 1) / 2;
        var ratio = weights[index] / Math.max(maxWeight, 1);
        var scale = 0.52 + depth * 0.6 + Math.pow(ratio, 0.7) * 0.12;
        var x = x1 * radius;
        var y = y1 * radius;
        var opacity = 0.24 + depth * 0.68 + Math.min(ratio * 0.12, 0.12);

        nodes[index].style.transform = 'translate(-50%, -50%) translate(' + x + 'px, ' + y + 'px) scale(' + scale + ')';
        nodes[index].style.opacity = String(Math.min(opacity, 1).toFixed(3));
        nodes[index].style.zIndex = String(Math.round(depth * 1000));
      });
    }

    function tick() {
      if (!isDown) {
        rotationX += velocityX;
        rotationY += velocityY;
        ringSpin += ringSpinVelocity;
        velocityX *= 0.94;
        velocityY = velocityY * 0.94 + autoVelocityY * 0.06;
        ringSpinVelocity *= 0.9;
        ringSpin *= 0.985;
        if (Math.abs(velocityX) < 0.00002) velocityX = 0;
        if (Math.abs(ringSpinVelocity) < 0.002) ringSpinVelocity = 0;
      }
      render();
      requestAnimationFrame(tick);
    }

    sphere.addEventListener('pointerdown', function (event) {
      if (event.button && event.button !== 0) return;
      isDown = true;
      moved = false;
      activeLink = event.target.closest ? event.target.closest('.tag-sphere-node') : null;
      startX = event.clientX;
      startY = event.clientY;
      velocityX = 0;
      velocityY = 0;
      sphere.classList.add('is-dragging');
      sphere.setPointerCapture(event.pointerId);
    });

    sphere.addEventListener('pointermove', function (event) {
      if (!isDown) return;
      var dx = event.clientX - startX;
      var dy = event.clientY - startY;
      if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
      rotationY += dx * 0.006;
      rotationX -= dy * 0.006;
      ringSpin += dx * 0.08;
      ringSpin = Math.max(-26, Math.min(26, ringSpin));
      ringSpinVelocity = dx * 0.012;
      velocityY = dx * 0.0007;
      velocityX = -dy * 0.0007;
      startX = event.clientX;
      startY = event.clientY;
    });

    function endSphereDrag(event, allowActivate) {
      if (!isDown) return;
      isDown = false;
      sphere.classList.remove('is-dragging');
      if (event && sphere.hasPointerCapture(event.pointerId)) {
        sphere.releasePointerCapture(event.pointerId);
      }
      if (allowActivate && activeLink && !moved) {
        suppressNextClick = true;
        window.location.href = activeLink.href;
      }
      if (moved && Math.abs(velocityY) < autoVelocityY) {
        velocityY = velocityY < 0 ? -autoVelocityY : autoVelocityY;
      }
      activeLink = null;
      setTimeout(function () {
        moved = false;
      }, 0);
    }

    sphere.addEventListener('click', function (event) {
      if (!moved && !suppressNextClick) return;
      event.preventDefault();
      event.stopPropagation();
      suppressNextClick = false;
    }, true);

    sphere.addEventListener('pointerup', function (event) {
      endSphereDrag(event, true);
    });
    sphere.addEventListener('pointercancel', function (event) {
      endSphereDrag(event, false);
    });
    sphere.addEventListener('mouseleave', function (event) {
      endSphereDrag(event, false);
    });
    window.addEventListener('resize', function () {
      setTagSizes();
      render();
    });
    setTagSizes();
    render();
    requestAnimationFrame(tick);
  });

  var archiveInput = document.querySelector('[data-archive-search]');
  if (archiveInput) {
    var archiveItems = Array.prototype.slice.call(
      document.querySelectorAll('[data-archive-item]')
    );
    var archiveYears = Array.prototype.slice.call(
      document.querySelectorAll('[data-archive-year]')
    );
    var archiveEmpty = document.querySelector('[data-archive-empty]');

    function filterArchive() {
      var query = archiveInput.value.trim().toLowerCase();
      var anyVisible = false;

      archiveItems.forEach(function (item) {
        var title = item.getAttribute('data-archive-title') || '';
        var match = !query || title.indexOf(query) !== -1;
        item.hidden = !match;
        if (match) anyVisible = true;
      });

      archiveYears.forEach(function (year) {
        var hasVisible =
          year.querySelectorAll('[data-archive-item]:not([hidden])').length > 0;
        year.hidden = !hasVisible;
      });

      if (archiveEmpty) archiveEmpty.hidden = anyVisible;
    }

    archiveInput.addEventListener('input', filterArchive);
  }
})();
