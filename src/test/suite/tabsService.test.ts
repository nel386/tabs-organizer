import * as assert from 'assert';
import { TabsService } from '../../services/TabsService';

suite('TabsService Test Suite', () => {
  let tabsService: TabsService;

  setup(() => {
    tabsService = new TabsService();
  });

  test('Should get current open tabs', () => {
    const tabs = tabsService.getCurrentOpenTabs();
    assert.ok(Array.isArray(tabs));
  });

  test('Should return tabs count', () => {
    const count = tabsService.getTabsCount();
    assert.ok(typeof count === 'number');
    assert.ok(count >= 0);
  });
});
