// ___MODELS___

var Trial = Backbone.Model.extend({
  defaults: {
    present: false,
    isColorDistractor: false,
    isInFovia: false,
  },
  
  initialize: function(){
    
  },
});

var Subject = Backbone.Model.extend({
  defaults: {
    rightHanded: true,
    dce: 'aaa1234'
  },
  
  initialize: function(){
    
  },
});

var TrialResult = Backbone.Model.extend({
  defaults: {
    trial: null,
    subject: null,
    responseTime: 0,
    correct: false
  },
  
  initialize: function(){
    
  },
});

// ___COLLECTIONS___

var TrialCollection = Backbone.Collection.extend({
  localStorage: new Backbone.LocalStorage("Trials"),
  model: Trial,
});

var trials = new TrialCollection();

var SubjectCollection = Backbone.Collection.extend({
  localStorage: new Backbone.LocalStorage("Subjects"),
  model: Subject,
})

var subjects = new SubjectCollection();

var TrialResultCollection = Backbone.Collection.extend({
  localStorage: new Backbone.LocalStorage("TrialResults"),
  model: TrialResult,
  
  toCSV: function(){
    return this.map(function(elem) {
      return (elem.get("subject").get("dce") + ", " + 
              elem.get("trial").get("present") + ", " + 
              elem.get("trial").get("isColorDistractor") + ", " + 
              elem.get("trial").get("isInFovia") + ", " + 
              elem.get("responseTime") + ", " + 
              elem.get("correct"));
    }).join("<br />");
  },
});

var trialResults = new TrialResultCollection();

// ___VIEWS___

var TrialsView = Backbone.View.extend({
  el: $("#view-output"),
  
  initialize: function(){
    _.bindAll(this, 'render', 'response', 'next_trial');
    
    $(document).keydown(this.response);
    
    $(this.el).show();
    
    this.trialIndex = -1;
  },
  
  render: function(){
  },
  
  response: function(event) {
    if (this.subject.get("rightHanded")) {
      if (event.keyCode === 81) {// q
        this.trialView.negativeResponse(event);
      } else if (event.keyCode === 80) {//p
        this.trialView.positiveResponse(event);
      }
    } else {
      if (event.keyCode === 80) {//p
        this.trialView.negativeResponse(event);
      } else if (event.keyCode === 81) {//q
        this.trialView.positiveResponse(event);
      }
    }
  },
  
  next_trial: function(){
    this.trialIndex += 1;
    if (this.trialIndex  === trials.length) {
        var resultsView = new ResultsView();
        resultsView.render()
        return;
    }
    
    this.curTrial = trials.at(this.trialIndex);
    
    this.trialView = new TrialView();
    this.trialView.trial = this.curTrial;
    this.trialView.subject = this.subject;
    this.trialView.render();
  },
});

var ResultsView = Backbone.View.extend({
  el: $("#results"),
  template: _.template($("#results-template").html()),
  
  events: {
    'click #next-subject': 'next_subject'
  },
  
  initialize: function() {
    _.bindAll(this, 'render', 'next_subject');
    $(this.el).show();
    $("#view-output").hide();
  },
  
  render: function() {
    $(this.el).html(this.template({
      data: trialResults.toCSV()
    }))
  },
  
  next_subject: function(){
    newView.start_new_subject();
    $("#results").hide();
  },
})

var TrialView = Backbone.View.extend({
  el: $("#trial"),
  template: _.template($("#trial-template").html()),
  fixationTemplate: _.template($("#fixation-template").html()),
  
  initialize: function(){
    _.bindAll(this, 'render', 'positiveResponse', 'negativeResponse');
  },
  
  render: function(){
    var stimulus_type = this.trial.get("isColorDistractor") ? "color" : "line";
    var target = this.trial.get("present") ? Math.floor((Math.random() * 16) + 1) : -1;
    var is_close = this.trial.get("isInFovia") ? "near" : "far";
    var self = this;
    
    $(this.el)
      .html(this.fixationTemplate())
      .queue(function(next) {
        self.startTime = (new Date()).getTime();
        
        if (next) next();
      })
      .delay(1500)
      .queue(function(next) {
        $(self.el)
          .html(self.template())
        
        $(".stimulus")
          .addClass(stimulus_type)
          .addClass(is_close);
        
        $("#trial-" + target)
          .addClass("target");
        
        if (next) next();
      });
  },
  
  positiveResponse: function(event){
    var result = new TrialResult({
      trial: this.trial,
      subject: this.subject,
      responseTime: (event.timeStamp - this.startTime - 1500),
      correct: this.trial.get("present")
    });
    
    if (!result.get("correct")) {
      // handle error correction
    }
    
    trialResults.add(result);
    
    window.trialsview.next_trial();
  },
  
  negativeResponse: function(event){
    var result = new TrialResult({
      trial: this.trial,
      subject: this.subject,
      responseTime: (event.timeStamp - this.startTime - 1500),
      correct: !(this.trial.get("present"))
    });
    
    if (!result.get("correct")) {
      // handle error correction
    }
    
    trialResults.add(result);
    
    window.trialsview.next_trial();
  },
});

var NewSubjectView = Backbone.View.extend({
  el: $("#new-subject-view"),
  
  events: {
    'keypress #new-subject': 'create_on_enter'
  },
  
  initialize: function(){
    _.bindAll(this, 'render', 'create_on_enter', 'start_new_subject');
  },
  render: function(){
    $(this.el).html(this.template({
    }));
  },
  
  create_on_enter: function(e){
    if (e.keyCode === 13) {
      var subject = new Subject({
        dce: $("#new-subject").val(),
        rightHanded: $("#handedness-check").is(":checked"),
      });
      subjects.add(subject);
      
      $(this.el).hide();
      
      window.trialsview = new TrialsView();
      window.trialsview.subject = subject;
      window.trialsview.next_trial();
      
      $("#new-subject").val('');
    }
  },
  
  start_new_subject: function() {
    $(this.el).show();
  }
});

var newView = new NewSubjectView();

shuffle = function(o){ //v1.0
  for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
  return o;
};

$(function() {
  var i, ar = [];

  // Generate all of our trials
  for (i = 0; i < 30; i++) {
    ar.push(new Trial({
      present: false,
      isColorDistractor: false,
      isInFovia: false
    }));
  }
  
  for (i = 0; i < 30; i++) {
    ar.push(new Trial({
      present: false,
      isColorDistractor: false,
      isInFovia: true
    }));
  }
  
  for (i = 0; i < 30; i++) {
    ar.push(new Trial({
      present: false,
      isColorDistractor: true,
      isInFovia: false
    }));
  }
  
  for (i = 0; i < 30; i++) {
    ar.push(new Trial({
      present: false,
      isColorDistractor: true,
      isInFovia: true
    }));
  }
  
  for (i = 0; i < 30; i++) {
    ar.push(new Trial({
      present: true,
      isColorDistractor: false,
      isInFovia: false
    }));
  }
  
  for (i = 0; i < 30; i++) {
    ar.push(new Trial({
      present: true,
      isColorDistractor: false,
      isInFovia: true
    }));
  }
  
  for (i = 0; i < 30; i++) {
    ar.push(new Trial({
      present: true,
      isColorDistractor: true,
      isInFovia: false
    }));
  }
  
  for (i = 0; i < 30; i++) {
    ar.push(new Trial({
      present: true,
      isColorDistractor: true,
      isInFovia: true
    }));
  }
  
  // Shuffle the possible trials, and dump them into our trial collection
  _.each(shuffle(ar), function(obj) {
    trials.add(obj);
  })
  
});
