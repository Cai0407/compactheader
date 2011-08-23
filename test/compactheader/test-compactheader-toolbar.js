/* ***** BEGIN LICENSE BLOCK *****
 *   Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Thunderbird Mail Client.
 *
 * The Initial Developer of the Original Code is
 * the Mozilla Foundation.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Joachim Herb <Joachim.Herb@gmx.de>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var MODULE_NAME = 'test-compactheader-toolbar';

var RELATIVE_ROOT = '../shared-modules';
var MODULE_REQUIRES = ['folder-display-helpers', 'window-helpers',
                       'address-book-helpers', 'mouse-event-helpers',
                       'compactheader-helpers'];

var elib = {};
Cu.import('resource://mozmill/modules/elementslib.js', elib);
var controller = {};
Cu.import('resource://mozmill/modules/controller.js', controller);

// The WindowHelper module
var WindowHelper;

var folder;

const PREF = "toolbar.customization.usesheet";
var prefBranch = Cc["@mozilla.org/preferences-service;1"]
                    .getService(Ci.nsIPrefService).getBranch(null);

function setupModule(module) {
  let fdh = collector.getModule('folder-display-helpers');
  fdh.installInto(module);
  WindowHelper = collector.getModule('window-helpers');
  WindowHelper.installInto(module);
  let abh = collector.getModule('address-book-helpers');
  abh.installInto(module);
  let meh = collector.getModule('mouse-event-helpers');
  meh.installInto(module);
  let chh = collector.getModule('compactheader-helpers');
  chh.installInto(module);

  folder = create_folder("MessageWindowB");

  // create a message that has the interesting headers that commonly
  // show up in the message header pane for testing
  let msg = create_message({cc: msgGen.makeNamesAndAddresses(20), // YYY
                            subject: "This is a really, really, really, really, really, really, really, really, long subject.",
                            clobberHeaders: {
                              "Newsgroups": "alt.test",
                              "Reply-To": "J. Doe <j.doe@momo.invalid>",
                              "Content-Base": "http://example.com/",
                              "Bcc": "Richard Roe <richard.roe@momo.invalid>"
                            }});

  add_message_to_folder(folder, msg);

  // create a message that has boring headers to be able to switch to and
  // back from, to force the more button to collapse again.
  msg = create_message();
  add_message_to_folder(folder, msg);
}


/**
 *  Make sure that opening the header toolbar customization dialog
 *  does not break the get messages button in main toolbar
 */
function test_get_msg_button_customize_header_toolbar(){
  select_message_in_folder(folder, 0, mc);
  expand_and_assert_header(mc);

  // It is necessary to press the Get Message Button to get the popup menu populated
  mc.click(mc.aid("button-getmsg", {class: "toolbarbutton-menubutton-dropmarker"}));
  mc.ewait("button-getAllNewMsgSeparator");

  var getMailButtonPopup = mc.eid("button-getMsgPopup").node;
  var originalServerCount = getMailButtonPopup.childElementCount;

  // Open customization dialog, because it broke the Get Message Button popup menu
  // see https://bugzilla.mozilla.org/show_bug.cgi?id=565045
  let ctc = open_header_pane_toolbar_customization(mc);
  close_header_pane_toolbar_customization(ctc);

  // Press the Get Message Button to populate popup menu again
  mc.click(mc.aid("button-getmsg", {class: "toolbarbutton-menubutton-dropmarker"}));
  mc.ewait("button-getAllNewMsgSeparator");

  getMailButtonPopup = mc.eid("button-getMsgPopup").node;
  var finalServerCount = getMailButtonPopup.childElementCount;

  if (originalServerCount != finalServerCount) {
    throw new Error("number of entries in Get Message Button popup menu after " +
                    "header toolbar customization " +
                    finalServerCount + " <> as before: " +
                    originalServerCount);
  }
}

/**
 *  Test header pane toolbar customization: Check for default button sets
 */
function test_customize_header_toolbar_check_default()
{
  let curMessage = select_message_in_folder(folder, 0, mc);
  let hdrToolbar = mc.eid("header-view-toolbar").node;
  let hdrBarDefaultSet = hdrToolbar.getAttribute("defaultset");
  expand_and_assert_header(mc);
  assert_equals(hdrToolbar.currentSet, hdrBarDefaultSet);
  // In a fresh profile the currentset attribute does not
  // exist, i.e. it returns empty. So check for both valid
  // posiblities.
  assert_true((hdrToolbar.getAttribute("currentset") == "") ||
    (hdrToolbar.getAttribute("currentset") == hdrBarDefaultSet),
    "Header Toolbar currentset should be empty or contain default buttons "+
    "but contains: " + hdrToolbar.getAttribute("currentset"));
  // Now make sure, that also the attribute gets set:
  restore_and_check_default_buttons(mc);

  // Display message in new window and check that the default
  // buttons are shown there.
  let msgc = open_selected_message_in_new_window();
  assert_selected_and_displayed(msgc, curMessage);
  expand_and_assert_header(msgc);
  let hdrToolbar = msgc.eid("header-view-toolbar").node;
  let hdrBarDefaultSet = hdrToolbar.getAttribute("defaultset");
  assert_equals(hdrToolbar.currentSet, hdrBarDefaultSet);
  // In a fresh profile the currentset attribute does not
  // exist, i.e. it returns empty. So check for both valid
  // posiblities.
  assert_true((hdrToolbar.getAttribute("currentset") == "") ||
    (hdrToolbar.getAttribute("currentset") == hdrBarDefaultSet),
    "Header Toolbar currentset should be empty or contain default buttons "+
    "but contains: " + hdrToolbar.getAttribute("currentset"));
  // Now make sure, that also the attribute gets set:
  restore_and_check_default_buttons(msgc);

  close_window(msgc);
}

///**
// *  Test header pane toolbar customization: Reorder buttons
// */
function test_customize_header_toolbar_reorder_buttons()
{
  let curMessage = select_message_in_folder(folder, 0, mc);

  // Restore the default buttons to get defined starting conditions.
  restore_and_check_default_buttons(mc);
  expand_and_assert_header(mc);

  // Save the currentSet of the toolbar before opening the
  // customization dialog, to get out of the way of the
  // wrapper- prefix.
  let toolbar = mc.eid("header-view-toolbar").node;
  let oldSet = filterInvisibleButtons(mc, toolbar.currentSet).split(",");

  let ctc = open_header_pane_toolbar_customization(mc);
  let currentSet = filterInvisibleButtons(mc, toolbar.currentSet).split(",");

  for (let i=1; i<currentSet.length; i++) {
    let button1 = mc.e(currentSet[i]);
    let button2 = mc.e(currentSet[i-1]);
    // Move each button to the left of its left neighbour starting with
    // the second button, i.e. reverse the order of the buttons.
    drag_n_drop_element(button1, mc.window, button2, mc.window, 0.25, 0.0, toolbar);
  }
  close_header_pane_toolbar_customization(ctc);

  // Check, if the toolbar is really in reverse order of beginning.
  let reverseSet = oldSet.reverse().join(",");
  assert_equals(filterInvisibleButtons(mc, toolbar.currentSet), reverseSet);
  assert_equals(filterInvisibleButtons(mc, toolbar.getAttribute("currentset")),
      reverseSet);

  // Display message in new window and check that the default
  // buttons are shown there.
  let msgc = open_selected_message_in_new_window();
  assert_selected_and_displayed(msgc, curMessage);
  expand_and_assert_header(msgc);
  let hdrToolbar = msgc.eid("header-view-toolbar").node;
  let hdrBarDefaultSet = hdrToolbar.getAttribute("defaultset");
  assert_equals(hdrToolbar.currentSet, hdrBarDefaultSet);
  assert_equals(hdrToolbar.getAttribute("currentset"), hdrBarDefaultSet);
  close_window(msgc);

  // Leave the toolbar in the default state.
  restore_and_check_default_buttons(mc);
}
//
///**
// *  Test header pane toolbar customization: Change buttons in
// *  separate mail window
// */
function test_customize_header_toolbar_separate_window()
{
  let curMessage = select_message_in_folder(folder, 0, mc);
  expand_and_assert_header(mc);

  // Restore the default buttons to get defined starting conditions.
  restore_and_check_default_buttons(mc);

  // Display message in new window and check that the default
  // buttons are shown there.
  let msgc = open_selected_message_in_new_window();
  assert_selected_and_displayed(msgc, curMessage);
  expand_and_assert_header(msgc);
  let hdrToolbar = msgc.eid("header-view-toolbar").node;
  let hdrBarDefaultSet = hdrToolbar.getAttribute("defaultset");
  assert_equals(hdrToolbar.currentSet, hdrBarDefaultSet);
  assert_equals(hdrToolbar.getAttribute("currentset"), hdrBarDefaultSet);

  // Save the currentSet of the toolbar before opening the
  // customization dialog, to get out of the way of the
  // wrapper- prefix.
  let toolbar = msgc.eid("header-view-toolbar").node;
  let oldSet = filterInvisibleButtons(msgc, toolbar.currentSet).split(",");

  let ctc = open_header_pane_toolbar_customization(msgc);
  let currentSet = filterInvisibleButtons(msgc, toolbar.currentSet).split(",");
  for (let i=1; i<currentSet.length; i++) {
    let button1 = msgc.e(currentSet[i]);
    let button2 = msgc.e(currentSet[i-1]);
    // Move each button to the left of its left neighbour starting with
    // the second button, i.e. reverse the order of the buttons.
    drag_n_drop_element(button1, msgc.window, button2, msgc.window, 0.25, 0.0, toolbar);
  }
  close_header_pane_toolbar_customization(ctc);

  // Check, if the toolbar is really in reverse order of beginning.
  let reverseSet = oldSet.reverse().join(",");
  assert_equals(filterInvisibleButtons(msgc, toolbar.currentSet), reverseSet);
  assert_equals(filterInvisibleButtons(msgc, toolbar.getAttribute("currentset")),
      reverseSet);

  // Make sure we have a different window open, so that we don't start shutting
  // down just because the last window was closed
  let abwc = openAddressBook();
  // The 3pane window is closed and opened again.
  close3PaneWindow();
  close_window(msgc);

  mc = open3PaneWindow();
  abwc.window.close();
  select_message_in_folder(folder, 0, mc);

  // Check, if the buttons in the mail3pane window are the correct ones.
  let hdrToolbar = mc.eid("header-view-toolbar").node;
  let hdrBarDefaultSet = hdrToolbar.getAttribute("defaultset");
  assert_equals(hdrToolbar.currentSet, hdrBarDefaultSet);
  assert_equals(hdrToolbar.getAttribute("currentset"), hdrBarDefaultSet);

  // Open separate mail window again and check another time.
  let msgc = open_selected_message_in_new_window();
  assert_selected_and_displayed(msgc, curMessage);
  let toolbar = msgc.eid("header-view-toolbar").node;
  assert_equals(filterInvisibleButtons(msgc, toolbar.currentSet), reverseSet);
  assert_equals(filterInvisibleButtons(msgc, toolbar.getAttribute("currentset")),
      reverseSet);

  // Leave the toolbar in the default state.
  restore_and_check_default_buttons(msgc);
  close_window(msgc);
}

/**
 *  Test header pane toolbar customization: Remove buttons
 */
function test_customize_header_toolbar_remove_buttons(){
  // Save currentset of toolbar for adding the buttons back
  // at the end.
  var lCurrentset;

  select_message_in_folder(folder, 0, mc);
  expand_and_assert_header(mc);

  // Restore the default buttons to get defined starting conditions.
  restore_and_check_default_buttons(mc);

  let ctc = open_header_pane_toolbar_customization(mc);
  let toolbar = mc.eid("header-view-toolbar").node;
  lCurrentset = filterInvisibleButtons(mc, toolbar.currentSet).split(",");
  let target = ctc.e("palette-box");
  for (let i=0; i<lCurrentset.length; i++) {
    let button = mc.e(lCurrentset[i]);
    drag_n_drop_element(button, mc.window, target, ctc.window, 0.5, 0.5, toolbar);
  }
  close_header_pane_toolbar_customization(ctc);

  // Check, if the toolbar is really empty.
  let toolbar = mc.eid("header-view-toolbar").node;
  assert_equals(filterInvisibleButtons(mc, toolbar.currentSet), "__empty");
  assert_equals(filterInvisibleButtons(mc, toolbar.getAttribute("currentset")),
      "__empty");

  // Move to the next message and check again.
  let curMessage = select_message_in_folder(folder, 1, mc);
  assert_equals(filterInvisibleButtons(mc, toolbar.currentSet), "__empty");
  assert_equals(filterInvisibleButtons(mc, toolbar.getAttribute("currentset")),
      "__empty");

  // Display message in new window and check that the default
  // buttons are shown there.
  let msgc = open_selected_message_in_new_window();
  assert_selected_and_displayed(msgc, curMessage);
  expand_and_assert_header(msgc);

  let hdrToolbar = msgc.eid("header-view-toolbar").node;
  let hdrBarDefaultSet = hdrToolbar.getAttribute("defaultset");
  assert_equals(hdrToolbar.currentSet, hdrBarDefaultSet);
  assert_equals(hdrToolbar.getAttribute("currentset"), hdrBarDefaultSet);
  close_window(msgc);

  // Check the persistency of the buttons.

  // Make sure we have a different window open, so that we don't start shutting
  // down just because the last window was closed
  let abwc = openAddressBook();
  // The 3pane window is closed.
  close3PaneWindow();
  mc = open3PaneWindow();
  abwc.window.close();
  select_message_in_folder(folder, 0, mc);

  let toolbar = mc.eid("header-view-toolbar").node;
  assert_equals(filterInvisibleButtons(mc, toolbar.currentSet), "__empty");
  assert_equals(filterInvisibleButtons(mc, toolbar.getAttribute("currentset")),
      "__empty");

  // Check that all removed buttons show up in the palette
  // and move it back in the toolbar.
  let ctc = open_header_pane_toolbar_customization(mc);
  let toolbar = mc.eid("header-view-toolbar").node;
  let palette = ctc.e("palette-box");
  for (let i=0; i<lCurrentset.length; i++) {
    let button = ctc.e(lCurrentset[i]);
    assert_true(button!=null, "Button " + lCurrentset[i] + " not in palette");
    // Drop each button to the right end of the toolbar, so we should get the
    // original order.
    drag_n_drop_element(button, ctc.window, toolbar, mc.window, 0.99, 0.5, palette);
  }
  close_header_pane_toolbar_customization(ctc);

  let toolbar = mc.eid("header-view-toolbar").node;
  assert_equals(filterInvisibleButtons(mc, toolbar.currentSet),
      filterInvisibleButtons(mc, hdrBarDefaultSet));
  assert_equals(filterInvisibleButtons(mc, toolbar.getAttribute("currentset")),
      filterInvisibleButtons(mc, hdrBarDefaultSet));
}

/**
 *  Test header pane toolbar customization: Add all buttons to toolbar
 */
function test_customize_header_toolbar_add_all_buttons(){

  select_message_in_folder(folder, 0, mc);
  expand_and_assert_header(mc);

  // Restore the default buttons to get defined starting conditions.
  restore_and_check_default_buttons(mc);

  let toolbar = mc.eid("header-view-toolbar").node;
  let lCurrentset = filterInvisibleButtons(mc, toolbar.currentSet).split(",");

  // Get all buttons in the palette and move them to toolbar
  let ctc = open_header_pane_toolbar_customization(mc);
  let palette = ctc.e("palette-box");
  let tmp = ctc.window.document.getElementById("palette-box").
    getElementsByTagName("toolbarpaletteitem");

  let wrappedButtons = new Array;
  let buttons = new Array;
  for (let i=0; i<tmp.length; i++) {
    let type = tmp[i].getAttribute("type");
    if ((type != "separator") &&
        (type != "spring") &&
        (type != "spacer")
        ) {
      wrappedButtons.push(tmp[i].id)
      buttons.push(tmp[i].id.replace(new RegExp("wrapper-"), ""));
    }
  }

  for (let i=0; i<wrappedButtons.length; i++) {
    let button = ctc.e(wrappedButtons[i]);
    // Drop each button to the right end of the toolbar.
    drag_n_drop_element(button, ctc.window, toolbar, mc.window, 0.99, 0.5, palette);
  }
  close_header_pane_toolbar_customization(ctc);


  // All buttons have shown up in the toolbar
  let fullButtonSet = lCurrentset.concat(buttons).join(",");
  assert_equals(filterInvisibleButtons(mc, toolbar.currentSet),
      fullButtonSet);

  // No buttons are left in the palette
  // Get all buttons in the palette and move them to toolbar
  let ctc = open_header_pane_toolbar_customization(mc);
  let palette = ctc.e("palette-box");
  let tmp = ctc.window.document.getElementById("palette-box").
    getElementsByTagName("toolbarpaletteitem");

  let leftButtons = new Array;
  for (let i=0; i<tmp.length; i++) {
    let type = tmp[i].getAttribute("type");
    if ((type != "separator") &&
        (type != "spring") &&
        (type != "spacer")
        ) {
      leftButtons.push(tmp[i].id)
    }
  }
  assert_equals(leftButtons.length, 0);
  close_header_pane_toolbar_customization(ctc);

  // Move the buttons back to palette
  let ctc = open_header_pane_toolbar_customization(mc);
  let target = ctc.e("palette-box");
  for (let i=0; i<wrappedButtons.length; i++) {
    let button = mc.e(wrappedButtons[i]);
    drag_n_drop_element(button, mc.window, target, ctc.window, 0.5, 0.5, toolbar);
  }
  close_header_pane_toolbar_customization(ctc);

  // Only defaults button are left in the toolbar
  let hdrBarDefaultSet = toolbar.getAttribute("defaultset");
  assert_equals(filterInvisibleButtons(mc, toolbar.currentSet),
      filterInvisibleButtons(mc, hdrBarDefaultSet));
  assert_equals(filterInvisibleButtons(mc, toolbar.getAttribute("currentset")),
      filterInvisibleButtons(mc, hdrBarDefaultSet));

  // All buttons have shown up in the palette
  let ctc = open_header_pane_toolbar_customization(mc);
  let backButtons = new Array;
  let tmp = ctc.window.document.getElementById("palette-box").
    getElementsByTagName("toolbarpaletteitem");
  for (let i=0; i<tmp.length; i++) {
    let type = tmp[i].getAttribute("type");
    if ((type != "separator") &&
        (type != "spring") &&
        (type != "spacer")
        ) {
      backButtons.push(tmp[i].id)
    }
  }
  assert_equals(backButtons.join(","), wrappedButtons.join(","));
  close_header_pane_toolbar_customization(ctc);

  // Reopen customization dialog and
  // all buttons are still in the palette
  let ctc = open_header_pane_toolbar_customization(mc);

  let backButtons = new Array;
  let tmp = ctc.window.document.getElementById("palette-box").
    getElementsByTagName("toolbarpaletteitem");
  for (let i=0; i<tmp.length; i++) {
    let type = tmp[i].getAttribute("type");
    if ((type != "separator") &&
        (type != "spring") &&
        (type != "spacer")
        ) {
      backButtons.push(tmp[i].id)
    }
  }
  assert_equals(backButtons.join(","), wrappedButtons.join(","));

  close_header_pane_toolbar_customization(ctc);

}


/**
 *  Test header pane toolbar customization dialog layout
 */
function test_customize_header_toolbar_dialog_style(){
  select_message_in_folder(folder, 0, mc);
  expand_and_assert_header(mc);

  // Restore the default buttons to get defined starting conditions.
  restore_and_check_default_buttons(mc);

  let ctc = open_header_pane_toolbar_customization(mc);

  // The full mode menulist entry is hidden, because in the header toolbar
  // this mode is disabled.
  let fullMode = ctc.window.document.getElementById("main-box").
    querySelector("[value='full']");
  assert_equals(ctc.window.getComputedStyle(fullMode).getPropertyValue("display"), "none");
  // The icon menulist entry is selected, because in the header toolbar with CompactHeader installed
  // this is the default mode.
  let iconMode = ctc.window.document.getElementById("modelist").
    querySelector("[value='icons']");
  assert_equals(iconMode.getAttribute("selected"), "true");

  // The small icons checkbox is hidden, because in the header toolbar
  // this mode is the only possible (therefore, the checked attribute is true).
  let smallIcons = ctc.eid("smallicons").node;
  assert_equals(smallIcons.getAttribute("checked"), "true");
  assert_equals(ctc.window.getComputedStyle(smallIcons).getPropertyValue("display"), "none");

  // The add new toolbar button is hidden, because in the header toolbar
  // this functionality is not available.
  let addNewToolbar = ctc.window.document.getElementById("main-box").
    querySelector("[oncommand='addNewToolbar();']");
  assert_equals(ctc.window.getComputedStyle(addNewToolbar).getPropertyValue("display"), "none");

  close_header_pane_toolbar_customization(ctc);
}

/**
 *  Test header pane toolbar customization dialog for button style changes
 */
function test_customize_header_toolbar_change_button_style(){
  select_message_in_folder(folder, 0, mc);
  expand_and_assert_header(mc);

  // Restore the default buttons to get defined starting conditions.
  restore_and_check_default_buttons(mc);
  // The default mode is icon visible only.
  subtest_buttons_style("-moz-box", "none");

  // Change the button style to text and icon mode
  let ctc = open_header_pane_toolbar_customization(mc);
  let iconMode = ctc.window.document.getElementById("main-box").
    querySelector("[value='textbesideicon']");
  ctc.click(new elib.Elem(iconMode));
  close_header_pane_toolbar_customization(ctc);

  subtest_buttons_style("-moz-box", "-moz-box");

  // Change the button style to icon mode only
  let ctc = open_header_pane_toolbar_customization(mc);
  let iconMode = ctc.window.document.getElementById("main-box").
    querySelector("[value='icons']");
  ctc.click(new elib.Elem(iconMode));
  close_header_pane_toolbar_customization(ctc);

  subtest_buttons_style("-moz-box", "none");

  // Change the button style to text (only) mode
  let ctc = open_header_pane_toolbar_customization(mc);
  let textMode = ctc.window.document.getElementById("main-box").
    querySelector("[value='text']");
  ctc.click(new elib.Elem(textMode));
  close_header_pane_toolbar_customization(ctc);

  subtest_buttons_style("none", "-moz-box");

  // The default mode is icon visible only.
  restore_and_check_default_buttons(mc);
  subtest_buttons_style("-moz-box", "none");
}

/**
 *  Check all buttons in the toolbar for the correct style
 *  of text and icon.
 */
function subtest_buttons_style(aIconVisibility, aLabelVisibility)
{
  let toolbar = mc.eid("header-view-toolbar").node;
  let currentSet = filterInvisibleButtons(mc, toolbar.currentSet).split(",");

  for (let i=0; i<currentSet.length; i++) {
    // XXX For the moment only consider normal toolbar buttons.
    // XXX Handling of toolbaritem buttons has to be added later,
    // XXX especially the smart reply button!
    if (mc.eid(currentSet[i]).node.tagName == "toolbarbutton") {
      let icon = mc.aid(currentSet[i], {class: "toolbarbutton-icon"}).node;
      let label = mc.aid(currentSet[i], {class: "toolbarbutton-text"}).node;
      assert_equals(mc.window.getComputedStyle(icon).getPropertyValue("display"), aIconVisibility);
      assert_equals(mc.window.getComputedStyle(label).getPropertyValue("display"), aLabelVisibility);
    }
  }
}

/**
 *  Restore the default buttons in the header pane toolbar
 *  by clicking the corresponding button in the palette dialog
 *  and check if it worked.
 */
function restore_and_check_default_buttons(aController)
{
  let ctc = open_header_pane_toolbar_customization(aController);
  let restoreButton = ctc.window.document.getElementById("main-box").
    querySelector("[oncommand='overlayRestoreDefaultSet();']");
  ctc.click(new elib.Elem(restoreButton));
  close_header_pane_toolbar_customization(ctc);

  let hdrToolbar = aController.eid("header-view-toolbar").node;
  let hdrBarDefaultSet = hdrToolbar.getAttribute("defaultset");

  assert_equals(hdrToolbar.currentSet, hdrBarDefaultSet);
  assert_equals(hdrToolbar.getAttribute("currentset"), hdrBarDefaultSet);
}

/*
 * Open the header pane toolbar customization dialog.
 */
function open_header_pane_toolbar_customization(aController)
{
  let ctc;
  aController.click(aController.eid("CustomizeHeaderToolbar"));
  // Depending on preferences the customization dialog is
  // either a normal window or embedded into a sheet.
  if (prefBranch.getBoolPref(PREF, true)) {
    aController.ewait("donebutton");
    let contentWindow = aController.eid("customizeToolbarSheetIFrame").node.contentWindow;
    ctc = WindowHelper.augment_controller(new controller.MozMillController(contentWindow));
  }
  else {
    ctc = WindowHelper.wait_for_existing_window("CustomizeToolbarWindow");
  }
  return ctc;
}

/*
 * Close the header pane toolbar customization dialog.
 */
function close_header_pane_toolbar_customization(aCtc)
{
  aCtc.click(aCtc.eid("donebutton"));
  // XXX There should be an equivalent for testing the closure of
  // XXX the dialog embedded in a sheet, but I do not know how.
  if (!prefBranch.getBoolPref(PREF, true)) {
   assert_true(aCtc.window.closed, "The customization dialog is not closed.");
  }
}

/*
 * Remove invsible buttons from (comma separated) buttons list
 */
function filterInvisibleButtons(aController, aButtons) {
  let buttons = aButtons.split(",");
  let result = new Array;

  for (let i=1; i<buttons.length; i++) {
    button = buttons[i].replace(new RegExp("wrapper-"), "");
    if ((aController.eid(button).node) &&
        (!aController.eid(button).node.getAttribute("collapsed"))
        ) {
      result.push(buttons[i]);
    }
  }

  let strResult;
  if (result.length > 0) {
    strResult = result.join(",");
  }
  else {
    strResult = "__empty";
  }

  return strResult;
}

