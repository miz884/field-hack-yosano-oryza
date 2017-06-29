function StepMarker(map, route, num_steps) {
  this.map = map;
  this.steps = [];
  this.curr_index = 0;
  this.marker = new google.maps.Marker();

  var points = [];
  for (var leg_i = 0; leg_i < route.legs.length; ++leg_i) {
    var leg = route.legs[leg_i];
    for (var step_i = 0; step_i < leg.steps.length; ++step_i) {
      var step = leg.steps[step_i];
      for (var path_i = 0; path_i < step.path.length; ++path_i) {
        var path = step.path[path_i];
        var point = {"latLng": path};
        if (points.length == 0) {
          point.len = 0;
          point.total = 0;
        } else {
          point.len = google.maps.geometry.spherical.computeDistanceBetween(
            points[points.length - 1].latLng, point.latLng);
          point.total = points[points.length - 1].total + point.len;
        }
        points.push(point);
      }
    }
  }
  if (points.length <= 1) {
    return;
  }

  var step_len = points[points.length - 1].total / num_steps;
  var curr = 0;
  for (var distance = step_len; distance < points[points.length - 1].total; distance += step_len) {
    while (points[curr].total < distance && curr < points.length - 1) {
      ++ curr;
    }
    var ratio = (distance - points[curr - 1].total) / points[curr].len;
    var lat = points[curr - 1].latLng.lat() * (1 - ratio) + points[curr].latLng.lat() * ratio;
    var lng = points[curr - 1].latLng.lng() * (1 - ratio) + points[curr].latLng.lng() * ratio;
    this.steps.push({"lat":lat, "lng":lng});
  }
};

StepMarker.prototype.next = function() {
  ++this.curr_index;
  this.curr_index %= this.steps.length;
  this.redraw();
};

StepMarker.prototype.redraw = function() {
  if (! this.marker.getMap()) {
    this.marker.setMap(this.map);
  }
  this.marker.setPosition(this.steps[this.curr_index]);
};

StepMarker.prototype.clear = function() {
  this.marker.setMap(null);
};

function Animator(interval) {
  this.markers = [];
  this.interval = interval || 10;
  this.interval_id = null;
};

Animator.prototype.start = function() {
  this.interval_id = setInterval(function(animator) {
    var instance = animator;
    return function(){
      instance.next();
    }
  }(this), this.interval);
  console.log(this.markers);
};

Animator.prototype.stop = function() {
  clearInterval(this.interval_id);
  this.interval_id = null;
};

Animator.prototype.next = function() {
  this.markers.forEach(function(marker) {
    marker.next();
  });
};

Animator.prototype.clear = function() {
  this.stop();
  this.markers.forEach(function(marker) {
    marker.clear();
  });
};

Animator.prototype.reset = function() {
  this.clear();
  this.markers = [];
};

Animator.prototype.addMarker = function(marker) {
  this.markers.push(marker);
};

