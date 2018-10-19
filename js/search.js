document.addEventListener( 'DOMContentLoaded', function( event ) {

    var search = (function(){
        'use strict';

        //=================================================================================================================
        // Private variables for the Module
        //var people = ['Will', 'Steve'];
        
        //=================================================================================================================
        // Variables cached from the DOM
        /*
        var $el = $('#peopleModule');
        var $button = $el.find('button');
        var $input = $el.find('input');
        var $ul = $el.find('ul');
        var template = $el.find('#people-template').html();
        */

        //=================================================================================================================
        // Bind events
        //$button.on('click', addPerson);
        //$ul.delegate('i.del', 'click', deletePerson);              

        //=================================================================================================================
        _render();
        function _render() {
           //$ul.html(Mustache.render(template, {people: people}));
           console.log("in the search render, hoaName = "+config.getVal('hoaName'));
        }
        
        //=================================================================================================================
        // Module methods
        
        //=================================================================================================================
        // This is what is exposed from this Module
        return {
        };
        
    })(); // var util = (function(){
}); // document.addEventListener( 'DOMContentLoaded', function( event ) {
// util.cleanStr("this to clean");
    
/*
    function addPerson(value) {
        var name = (typeof value === "string") ? value : $input.val();
        people.push(name);
        _render();
        $input.val('');
    }
    function deletePerson(event) {
        var i;
        if (typeof event === "number") {
            i = event;
        } else {
            var $remove = $(event.target).closest('li');
            i = $ul.find('li').index($remove);
        }
        people.splice(i, 1);
        _render();
    }
*/  
  


