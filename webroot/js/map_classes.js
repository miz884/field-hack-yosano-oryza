function StepMarker(map, route, num_steps, icon) {
  this.map = map;
  this.steps = [];
  this.curr_index = 0;
  this.icon = (icon ? icon : "https://maps.google.com/mapfiles/kml/paddle/grn-square-lv.png");
  this.marker = new google.maps.Marker({
    icon: this.icon
  });

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
  this.interval = interval || 50;
  this.interval_id = null;
};

Animator.prototype.start = function() {
  this.interval_id = setInterval(function(animator) {
    var instance = animator;
    return function(){
      instance.next();
    }
  }(this), this.interval);
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
  this.markers = [];
};

Animator.prototype.addMarker = function(marker) {
  this.markers.push(marker);
};

function DirectionsManager(map) {
  this.map = map;
  this.directions_service = new google.maps.DirectionsService();
  this.routes = [];
  this.animator = new Animator();
  this.animator.start();
};

DirectionsManager.prototype.showRoute = function(origin, destination, icon, line_color) {
  var me = this;
  this.directions_service.route({
    origin: origin,
    destination: destination,
    travelMode: 'DRIVING'
  }, function() {
    return function(response, status) {
      if (status === 'OK') {
        var route = response.routes[0];
        var path = new google.maps.Polyline({
          path: route.overview_path,
          geodesic: true,
          strokeColor: (line_color ? line_color : '#FF0000'),
          strokeOpacity: 0.5,
          strokeWeight: 10
        });
        path.setMap(me.map);
        me.routes.push(path);
        var marker = new StepMarker(map, route, 60, icon);
        me.animator.addMarker(marker);
      } else {
        window.alert('Directions request failed due to ' + status);
      }
    }
  }());
};

DirectionsManager.prototype.clear = function() {
  this.routes.forEach(function(path) {
    path.setMap(null);
  });
  this.routes = [];
  this.animator.clear();
  this.animator.start();
};

DirectionsManager.prototype.showIncoming = function(loc) {
  if (! loc.incoming) {
    return;
  }
  var me = this;
  loc.incoming.forEach(function(link) {
    var source_location = LOCATIONS[link.source];
    me.showRoute(
      {lat: source_location.lat, lng: source_location.lng},
      {lat: loc.lat, lng: loc.lng},
      PRODUCTS[link.product].icon,
      "#00FF00"
    );
  });
};

DirectionsManager.prototype.showOutgoing = function(loc) {
  if (! loc.outgoing) {
    return;
  }
  var me = this;
  loc.outgoing.forEach(function(link) {
    var dest_location = LOCATIONS[link.destination];
    me.showRoute(
      {lat: loc.lat, lng: loc.lng},
      {lat: dest_location.lat, lng: dest_location.lng},
      PRODUCTS[link.product].icon,
      "#FFFF00"
    );
  });
};

DirectionsManager.prototype.showInOut = function(loc_label) {
  var loc = (LOCATIONS[loc_label] ? LOCATIONS[loc_label] : loc_label);
  this.clear();
  this.showIncoming(loc);
  this.showOutgoing(loc);
}

