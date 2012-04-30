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
    this.next_trial();
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
    if (this.trialView) this.trialView.remove();
    
    this.trialIndex += 1;
    this.curTrial = trials.at(this.trialIndex);
    
    this.trialView = new TrialView();
    this.trialView.trial = this.curTrial;
    this.trialView.render();
  },
});

var TrialView = Backbone.View.extend({
  el: $("#trial"),
  template: _.template($("#trial-template").html()),
  fixationTemplate: _.template($("#fixation-template").html()),
  
  initialize: function(){
    _.bindAll(this, 'render', 'positiveResponse', 'negativeResponse');
  },
  
  render: function(){
    var stimulus_type = this.trial.get("isColorDistractor") ? "color" : "line";
    var target = this.trial.get("present") ? Math.floor((Math.random() * 20) + 1) : -1;
    var is_close = this.trial.get("isInFovia") ? "near" : "far";
    var self = this;
    
    $(this.el)
      .html(this.fixationTemplate())
      .queue(function(next) {
        self.startTime = (new Date()).getTime();
        
        if (next) next();
      })
      .delay(500)
      .queue(function(next) {
        $(self.el)
          .html(self.template())
        
        $(".stimulus")
          .addClass(stimulus_type)
          .addClass(is_close);
        
        $("trial-" + target)
          .addClass("target");
        
        if (next) next();
      });
  },
  
  positiveResponse: function(event){
    var result = new TrialResult({
      trial: this.trial,
      subject: this.subject,
      responseTime: (event.timestamp - this.startTime),
      correct: this.trial.get("present")
    });
    
    if (!result.correct) {
      // handle error correction
    }
    
    trialResults.add(result);
    
    window.trialsview.next_trial();
  },
  
  negativeResponse: function(event){
    var result = new TrialResult({
      trial: this.trial,
      subject: this.subject,
      responseTime: (event.timestamp - this.startTime),
      correct: !(this.trial.get("present"))
    });
    
    if (!result.correct) {
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
      var subject = subjects.add(new Subject({
        dce: $("#new-subject").val(),
        rightHanded: $("handedness-check").is(":checked"),
      }));
      
      $(this.el).hide();
      
      window.trialsview = new TrialsView();
      window.trialsview.subject = subject;
    }
  },
  
  start_new_subject: function() {
    $(this.el).show();
  }
});

var newView = new NewSubjectView();

$(function() {
  var i;
  
  for (i = 0; i < 30; i++) {
    trials.add(new Trial({
      present: false,
      isColorDistractor: false,
      isInFovia: false
    }));
  }
  
  for (i = 0; i < 30; i++) {
    trials.add(new Trial({
      present: false,
      isColorDistractor: false,
      isInFovia: true
    }));
  }
  
  for (i = 0; i < 30; i++) {
    trials.add(new Trial({
      present: false,
      isColorDistractor: true,
      isInFovia: false
    }));
  }
  
  for (i = 0; i < 30; i++) {
    trials.add(new Trial({
      present: false,
      isColorDistractor: true,
      isInFovia: true
    }));
  }
  
  for (i = 0; i < 30; i++) {
    trials.add(new Trial({
      present: true,
      isColorDistractor: false,
      isInFovia: false
    }));
  }
  
  for (i = 0; i < 30; i++) {
    trials.add(new Trial({
      present: true,
      isColorDistractor: false,
      isInFovia: true
    }));
  }
  
  for (i = 0; i < 30; i++) {
    trials.add(new Trial({
      present: true,
      isColorDistractor: true,
      isInFovia: false
    }));
  }
  
  for (i = 0; i < 30; i++) {
    trials.add(new Trial({
      present: true,
      isColorDistractor: true,
      isInFovia: true
    }));
  }
  
  // populate trials with 30x each situation
});
