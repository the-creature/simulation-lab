'use strict';

describe('labApp', function () {
    // global settings
    var Settings = {
        beakerCount: 5,
        beakerWidth: 100,
        beakerHeight: 100
    };

    // tabs
    var containersTab = element(by.linkText('Containers'));
    var materialsTab = element(by.linkText('Materials'));
    var instrumentsTab = element(by.linkText('Instruments'));

    // shelf items
    var beaker = element.all(by.css('.shelf-item.beaker')).first();
    var water = element.all(by.css('.shelf-item.water')).first();
    var thermometer = element(by.css('.shelf-item.thermometer'));
    var burner = element(by.css('.shelf-item.bunsenburner'));

    // table
    var labTable = element(by.css('.lab-table'));

    // items dropped on table
    var firstBeaker = labTable.element(by.tagName('beaker'));
    var thermometerOnTable = labTable.element(by.xpath('//div[contains(@data-drop-uuid, "thermometer")]'));
    var burnerOnTable = labTable.element(by.xpath('//div[contains(@data-drop-uuid, "bunsenburner")]'));
    var burnerTap = element(by.xpath('//div[contains(@class, "bunsenburner-tap")]'));

    var pourInput = element(by.model('input'));
    var okButton = element(by.buttonText('OK'));

    //use pageLoadedStatus flag
    var pageLoadedStatus = false;

    beforeEach(function () {
        if (!pageLoadedStatus) {
            browser.get('http://localhost:8000/');
            pageLoadedStatus = true;
            browser.driver.sleep(10000);

            labTable.getLocation().then(function (labTablePosition) {
                Settings.tablePosition = labTablePosition;
            });

            labTable.getSize().then(function(labTableSize) {
                Settings.tableSize = labTableSize;
            });
        }
    });

    it('shelf items should be ready', function () {
        expect(element.all(by.css('.shelf-item')).count()).toEqual(18);
    });

    it('add many beakers should match', function () {
        var count = 0;
        var dragDropBeaker = function (x, y) {
            browser.actions().dragAndDrop(beaker, {x: x, y: y}).perform().then(function () {
                count++;
                if (count == Settings.beakerCount) {
                    return;
                } else {
                    browser.driver.sleep(1000);
                    x += Settings.beakerWidth;
                    dragDropBeaker(x, y);
                }
            });
        };

        dragDropBeaker(0, Settings.tablePosition.y - 50);

        expect(labTable.all(by.tagName('beaker')).count()).toEqual(Settings.beakerCount);
    });

    it('pour water to beaker should increase volume', function () {
        var beforeCanvas = null; //labTable.all(by.tagName('beaker')).first().element(by.css('.beaker-canvas'));
        var afterCanvas = null; //beforeCanvas;
        browser.executeScript(function () {
            beforeCanvas = document.querySelector('.lab-table').querySelector('beaker').querySelector('.beaker-canvas');
            var beforeImageData = beforeCanvas.toDataURL();
            return beforeImageData;
        }).then(function (beforeData) {
            materialsTab.click().then(function () {
                browser.driver.sleep(1000);
                browser.actions().dragAndDrop(water, firstBeaker).perform().then(function () {
                    browser.driver.sleep(1000);
                    pourInput.clear();
                    pourInput.sendKeys(150); // 150 ml
                    browser.driver.sleep(1000);
                    okButton.click();
                    browser.driver.sleep(1000);
                    browser.executeScript(function () {
                        afterCanvas = document.querySelector('.lab-table').querySelector('beaker').querySelector('.beaker-canvas');
                        var afterImageData = afterCanvas.toDataURL();
                        return afterImageData;
                    }).then(function (afterData) {
                        expect(beforeData).not.toEqual(afterData);
                    });
                });
            });
        });
    });

    it('clear table should remove all objects on table', function () {
        element(by.tagName('table-tools')).all(by.tagName('a')).get(2).click().then(function () {
            browser.driver.sleep(2000);
            element(by.buttonText('OK')).click();
            browser.driver.sleep(2000);
        });
        expect(element(by.binding('info.objects')).getText()).toEqual('Objects: 0');
    });

    it('group beaker, burner and thermometer should work', function () {
        var centerX = Settings.tableSize.width / 2;
        containersTab.click().then(function () {
            browser.driver.sleep(1000);
            browser.actions().dragAndDrop(beaker, {x: 0, y: Settings.tablePosition.y - 50}).perform().then(function () {
                browser.driver.sleep(1000);
                materialsTab.click().then(function () {
                    browser.driver.sleep(1000);
                    browser.actions().dragAndDrop(water, firstBeaker).perform().then(function () {
                        browser.driver.sleep(1000);
                        pourInput.clear();
                        pourInput.sendKeys(150); // 150 ml
                        browser.driver.sleep(1000);
                        okButton.click();
                        browser.driver.sleep(1000);
                        instrumentsTab.click().then(function () {
                            browser.driver.sleep(1000);
                            browser.actions().dragAndDrop(thermometer, {
                                x: 100,
                                y: Settings.tablePosition.y - 100
                            }).perform().then(function () {
                                browser.driver.sleep(1000);
                                browser.actions().dragAndDrop(thermometerOnTable, firstBeaker).perform().then(function () {
                                    browser.driver.sleep(1000);
                                    browser.actions().dragAndDrop(burner, {
                                        x: centerX - 200,
                                        y: Settings.tablePosition.y - 150
                                    }).perform().then(function () {
                                        browser.driver.sleep(1000);
                                        browser.actions().dragAndDrop(firstBeaker, burnerOnTable).perform().then(function () {
                                            browser.driver.sleep(1000);
                                            burnerTap.click().then(function () {
                                                browser.driver.sleep(1000);
                                                burnerTap.click().then(function () {
                                                    browser.driver.sleep(1000);
                                                    burnerTap.click().then(function () {
                                                        browser.driver.sleep(5000);
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            })
                        });
                    });
                });
            });
        });

        expect(element(by.css('.bunsenburner-tripod')).isPresent()).toBe(true);
        expect(element(by.binding('info.objects')).getText()).toEqual('Objects: 1');
    });
});