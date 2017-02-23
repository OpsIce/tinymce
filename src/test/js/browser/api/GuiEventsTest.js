asynctest(
  'GuiEventsTest',
 
  [
    'ephox.agar.api.Chain',
    'ephox.agar.api.Cursors',
    'ephox.agar.api.FocusTools',
    'ephox.agar.api.GeneralSteps',
    'ephox.agar.api.Keyboard',
    'ephox.agar.api.Mouse',
    'ephox.agar.api.Pipeline',
    'ephox.agar.api.Step',
    'ephox.agar.api.UiFinder',
    'ephox.agar.api.Waiter',
    'ephox.agar.mouse.Clicks',
    'ephox.alloy.api.events.GuiEvents',
    'ephox.alloy.dom.DomDefinition',
    'ephox.alloy.dom.DomRender',
    'ephox.alloy.test.TestStore',
    'ephox.sugar.api.properties.Attr',
    'ephox.sugar.api.properties.Css',
    'ephox.sugar.api.node.Element',
    'ephox.sugar.api.dom.Insert',
    'ephox.sugar.api.dom.InsertAll',
    'ephox.sugar.api.node.Node',
    'ephox.sugar.api.dom.Remove',
    'ephox.sugar.api.node.Text',
    'global!document',
    'global!window'
  ],
 
  function (Chain, Cursors, FocusTools, GeneralSteps, Keyboard, Mouse, Pipeline, Step, UiFinder, Waiter, Clicks, GuiEvents, DomDefinition, DomRender, TestStore, Attr, Css, Element, Insert, InsertAll, Node, Remove, Text, document, window) {
    var success = arguments[arguments.length - 2];
    var failure = arguments[arguments.length - 1];

    var page = DomRender.renderToDom(
      DomDefinition.nu({
        tag: 'div',
        classes: [ 'gui-events-test-container' ],
        defChildren: [
          {
            tag: 'input',
            classes: [ 'test-input' ]
          },
          {
            tag: 'div',
            classes: [ 'test-inner-div' ],
            defChildren: [
              {
                tag: 'span',
                classes: [ 'focusable-span' ],
                attributes: {
                  'tabindex': '-1'
                },
                styles: {
                  width: '200px',
                  height: '200px',
                  border: '1px solid blue',
                  display: 'inline-block'
                }
              },
              {
                tag: 'button',
                classes: [ 'test-button' ],
                innerHtml: 'Button'
              }
            ]
          }

        ]
      })
    );

    var doc = Element.fromDom(document);
    var body = Element.fromDom(document.body);
    Insert.append(body, page);

    var store = TestStore();


    var triggerEvent = function (eventName, event) {
      var target = event.target();
      var targetValue = Node.isText(target) ? 'text(' + Text.get(target) + ')' : Attr.get(target, 'class');
      store.adder({ eventName: eventName, target: targetValue })();
    };

    var broadcastEvent = function (eventName, event) {
      store.adder({ broadcastEventName: eventName })();
    };

    var sTestFocusInput = GeneralSteps.sequence([
      FocusTools.sSetFocus(
        'Focusing test input',
        page,
        '.test-input'
      ),

      store.sAssertEq(
        'Checking event log after focusing test-input',
        [
          { eventName: 'focusin', target: 'test-input' }
        ]
      ),

      store.sClear
    ]);

    var sTestFocusSpan = GeneralSteps.sequence([
      FocusTools.sSetFocus(
        'Focusing span',
        page,
        '.focusable-span'
      ),

      // Wait for the post.blur to fire.
      Step.wait(200),

      store.sAssertEq(
        'Checking event log after focusing span',
        [
          { eventName: 'focusout', target: 'test-input' },
          { eventName: 'focusin', target: 'focusable-span' },
          { eventName: 'alloy.blur.post', target: 'test-input' }
        ]
      ),

      store.sClear
    ]);

    var sTestKeydown = GeneralSteps.sequence([
      Keyboard.sKeydown(doc, 'A'.charCodeAt(0), { }),
      store.sAssertEq(
        'Checking event log after keydown',
        [
          { eventName: 'keydown', target: 'focusable-span' }
        ]
      ),
      store.sClear
    ]);

    var sTestClick = GeneralSteps.sequence([
      Mouse.sClickOn(page, '.test-button'),
      store.sAssertEq(
        'Checking event log after clicking on test-button',
        [
          { eventName: 'click', target: 'test-button' }
        ]
      ),
      store.sClear,
      Chain.asStep(page, [
        UiFinder.cFindIn('.test-button'),
        Cursors.cFollow([ 0 ]),
        Mouse.cClick
      ]),
      store.sAssertEq(
        'Checking event log after clicking on test-button text',
        [
          { eventName: 'click', target: 'text(Button)' }
        ]
      ),
      store.sClear
    ]);

    // TODO: VAN-12: Add agar support for input events.
    var sTestInput = Step.pass;

    // TODO: VAN-13: Add agar support for selectstart events
    var sTestSelectStart = Step.pass;

    var sTestMouseover = GeneralSteps.sequence([
      Mouse.sHoverOn(page, '.focusable-span'),
      store.sAssertEq(
        'Checking event log after hovering on focusable span',
        [
          { eventName: 'mouseover', target: 'focusable-span' }
        ]
      ),
      store.sClear
    ]);

    var sTestMouseOperation = function (eventName, op) {
      return GeneralSteps.sequence([
        Step.sync(function () {
          // TODO: Add others clicks to agar.
          op(page);
        }),
        store.sAssertEq(
          'Checking event log after ' + eventName + ' on root',
          [
            { eventName: eventName, target: 'gui-events-test-container' }
          ]
        ),
        store.sClear
      ]);
    };

    var sTestWindowScroll = GeneralSteps.sequence([
      store.sClear,
      Step.sync(function () {
        Css.set(page, 'margin-top', '2000px');
        window.scrollTo(0, 1000);
      }),
      // Wait for window scroll to come through
      Waiter.sTryUntil(
        'Waiting for window scroll event to broadcast',
        store.sAssertEq('Checking scroll should have fired', [ { broadcastEventName: 'alloy.system.scroll' } ]),
        100,
        1000
      ),
      Step.sync(function () {
        Css.remove(page, 'margin-top');
        window.scrollTo(0, 0);
      }),
      store.sClear
    ]);

    var sTestUnbind = GeneralSteps.sequence([
      Step.sync(function () {
        gui.unbind();
      }),

      store.sClear,

      FocusTools.sSetFocus(
        'Focusing test input',
        page,
        '.test-input'
      ),

      FocusTools.sSetFocus(
        'Focusing span',
        page,
        '.focusable-span'
      ),

      Keyboard.sKeydown(doc, 'A'.charCodeAt(0), { }),
      Mouse.sClickOn(page, '.test-button'),

      store.sAssertEq(
        'After unbinding events, nothing should be listened to any longer',
        [ ]
      )

      // TODO: Any other event triggers here.
    ]);

    var sTestChange = Step.pass;
    var sTestTransitionEnd = Step.pass;

    var gui = GuiEvents.setup(page, {
      triggerEvent: triggerEvent,
      broadcastEvent: broadcastEvent
    });

    Pipeline.async({}, [
      sTestFocusInput,
      sTestFocusSpan,
      sTestKeydown,      
      sTestClick,      
      sTestInput,
      sTestMouseover,
      sTestSelectStart,

      // FIX: Add API support to agar.
      sTestMouseOperation('mousedown', Clicks.mousedown),
      sTestMouseOperation('mouseup', Clicks.mouseup),
      sTestMouseOperation('mousemove', function (elem) { Clicks.mousemove(elem, 10, 10); }),
      sTestMouseOperation('mouseout', function (elem) { Clicks.mouseout(elem, 10, 10); }),
      sTestMouseOperation('contextmenu', Clicks.contextmenu),

      // FIX: Add API support to agar
      sTestChange,
      sTestTransitionEnd,

      sTestWindowScroll,

      sTestUnbind
    ], function () { 
      Remove.remove(page);
      success();
    }, failure);

  }
);