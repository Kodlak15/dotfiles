/*******************************************************************************

    uBlock Origin - a browser extension to block requests.
    Copyright (C) 2015-present Raymond Hill

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see {http://www.gnu.org/licenses/}.

    Home: https://github.com/gorhill/uBlock
*/

'use strict';

import { hostnameFromURI } from './uri-utils.js';
import { i18n, i18n$ } from './i18n.js';
import { dom, qs$, qsa$ } from './dom.js';

/******************************************************************************/

// TODO: fix the inconsistencies re. realm vs. filter source which have
//       accumulated over time.

const messaging = vAPI.messaging;
const logger = self.logger = { ownerId: Date.now() };
const logDate = new Date();
const logDateTimezoneOffset = logDate.getTimezoneOffset() * 60000;
const loggerEntries = [];

let filteredLoggerEntries = [];
let filteredLoggerEntryVoidedCount = 0;

let popupLoggerBox;
let popupLoggerTooltips;
let activeTabId = 0;
let filterAuthorMode = false;
let selectedTabId = 0;
let netInspectorPaused = false;
let cnameOfEnabled = false;

/******************************************************************************/

// Various helpers.

const tabIdFromPageSelector = logger.tabIdFromPageSelector = function() {
    const value = qs$('#pageSelector').value;
    return value !== '_' ? (parseInt(value, 10) || 0) : activeTabId;
};

const tabIdFromAttribute = function(elem) {
    const value = dom.attr(elem, 'data-tabid') || '';
    const tabId = parseInt(value, 10);
    return isNaN(tabId) ? 0 : tabId;
};

/******************************************************************************/
/******************************************************************************/

// Current design allows for only one modal DOM-based dialog at any given time.
//
const modalDialog = (( ) => {
    const overlay = qs$('#modalOverlay');
    const container = qs$(overlay, ':scope > div > div:nth-of-type(1)');
    const closeButton = qs$(overlay, ':scope > div > div:nth-of-type(2)');
    let onDestroyed;

    const removeChildren = logger.removeAllChildren = function(node) {
        while ( node.firstChild ) {
            node.removeChild(node.firstChild);
        }
    };

    const create = function(selector, destroyListener) {
        const template = qs$(selector);
        const dialog = dom.clone(template);
        removeChildren(container);
        container.appendChild(dialog);
        onDestroyed = destroyListener;
        return dialog;
    };

    const show = function() {
        dom.cl.add(overlay, 'on');
    };

    const destroy = function() {
        dom.cl.remove(overlay, 'on');
        const dialog = container.firstElementChild;
        removeChildren(container);
        if ( typeof onDestroyed === 'function' ) {
            onDestroyed(dialog);
        }
        onDestroyed = undefined;
    };

    const onClose = function(ev) {
        if ( ev.target === overlay || ev.target === closeButton ) {
            destroy();
        }
    };
    dom.on(overlay, 'click', onClose);
    dom.on(closeButton, 'click', onClose);

    return { create, show, destroy };
})();

self.logger.modalDialog = modalDialog;

/******************************************************************************/
/******************************************************************************/

const prettyRequestTypes = {
    'main_frame': 'doc',
    'stylesheet': 'css',
    'sub_frame': 'frame',
    'xmlhttprequest': 'xhr'
};

const uglyRequestTypes = {
    'doc': 'main_frame',
    'css': 'stylesheet',
    'frame': 'sub_frame',
    'xhr': 'xmlhttprequest'
};

let allTabIds = new Map();
let allTabIdsToken;

/******************************************************************************/
/******************************************************************************/

const regexFromURLFilteringResult = function(result) {
    const beg = result.indexOf(' ');
    const end = result.indexOf(' ', beg + 1);
    const url = result.slice(beg + 1, end);
    if ( url === '*' ) {
        return new RegExp('^.*$', 'gi');
    }
    return new RegExp('^' + url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
};

/******************************************************************************/

// Emphasize hostname in URL, as this is what matters in uMatrix's rules.

const nodeFromURL = function(parent, url, re) {
    const fragment = document.createDocumentFragment();
    if ( re === undefined ) {
        fragment.textContent = url;
    } else {
        if ( typeof re === 'string' ) {
            re = new RegExp(re.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        }
        const matches = re.exec(url);
        if ( matches === null || matches[0].length === 0 ) {
            fragment.textContent = url;
        } else {
            if ( matches.index !== 0 ) {
                fragment.appendChild(
                    document.createTextNode(url.slice(0, matches.index))
                );
            }
            const b = document.createElement('b');
            b.textContent = url.slice(matches.index, re.lastIndex);
            fragment.appendChild(b);
            if ( re.lastIndex !== url.length ) {
                fragment.appendChild(
                    document.createTextNode(url.slice(re.lastIndex))
                );
            }
        }
    }
    if ( /^https?:\/\//.test(url) ) {
        const a = document.createElement('a');
        dom.attr(a, 'href', url);
        dom.attr(a, 'target', '_blank');
        fragment.appendChild(a);
    }
    parent.appendChild(fragment);
};

/******************************************************************************/

const padTo2 = function(v) {
    return v < 10 ? '0' + v : v;
};

const normalizeToStr = function(s) {
    return typeof s === 'string' && s !== '' ? s : '';
};

/******************************************************************************/

const LogEntry = function(details) {
    if ( details instanceof Object === false ) { return; }
    const receiver = LogEntry.prototype;
    for ( const prop in receiver ) {
        if (
            details.hasOwnProperty(prop) &&
            details[prop] !== receiver[prop]
        ) {
            this[prop] = details[prop];
        }
    }
    this.type = details.stype || details.type;
    if ( details.aliasURL !== undefined ) {
        this.aliased = true;
    }
    if ( this.tabDomain === '' ) {
        this.tabDomain = this.tabHostname || '';
    }
    if ( this.docDomain === '' ) {
        this.docDomain = this.docHostname || '';
    }
    if ( this.domain === '' ) {
        this.domain = details.hostname || '';
    }
};
LogEntry.prototype = {
    aliased: false,
    dead: false,
    docDomain: '',
    docHostname: '',
    domain: '',
    filter: undefined,
    id: '',
    realm: '',
    tabDomain: '',
    tabHostname: '',
    tabId: undefined,
    textContent: '',
    tstamp: 0,
    type: '',
    voided: false,
};

/******************************************************************************/

const createLogSeparator = function(details, text) {
    const separator = new LogEntry();
    separator.tstamp = details.tstamp;
    separator.realm = 'message';
    separator.tabId = details.tabId;
    separator.type = 'tabLoad';
    separator.textContent = '';

    const textContent = [];
    logDate.setTime(separator.tstamp - logDateTimezoneOffset);
    textContent.push(
        // cell 0
        padTo2(logDate.getUTCHours()) + ':' +
            padTo2(logDate.getUTCMinutes()) + ':' +
            padTo2(logDate.getSeconds()),
        // cell 1
        text
    );
    separator.textContent = textContent.join('\t');

    if ( details.voided ) {
        separator.voided = true;
    }

    return separator;
};

/******************************************************************************/

// TODO: once refactoring is mature, consider using push() instead of
//       unshift(). This will require inverting the access logic
//       throughout the code.
//
const processLoggerEntries = function(response) {
    const entries = response.entries;
    if ( entries.length === 0 ) { return; }

    const autoDeleteVoidedRows = qs$('#pageSelector').value === '_';
    const previousCount = filteredLoggerEntries.length;

    for ( const entry of entries ) {
        const unboxed = JSON.parse(entry);
        if ( unboxed.filter instanceof Object ){
            loggerStats.processFilter(unboxed.filter);
        }
        if ( netInspectorPaused ) { continue; }
        const parsed = parseLogEntry(unboxed);
        if (
            parsed.tabId !== undefined &&
            allTabIds.has(parsed.tabId) === false
        ) {
            if ( autoDeleteVoidedRows ) { continue; }
            parsed.voided = true;
        }
        if (
            parsed.type === 'main_frame' &&
            parsed.aliased === false && (
                parsed.filter === undefined ||
                parsed.filter.source !== 'redirect'
            )
        ) {
            const separator = createLogSeparator(parsed, unboxed.url);
            loggerEntries.unshift(separator);
            if ( rowFilterer.filterOne(separator) ) {
                filteredLoggerEntries.unshift(separator);
                if ( separator.voided ) {
                    filteredLoggerEntryVoidedCount += 1;
                }
            }
        }
        if ( cnameOfEnabled === false && parsed.aliased ) {
            qs$('#filterExprCnameOf').style.display = '';
            cnameOfEnabled = true;
        }
        loggerEntries.unshift(parsed);
        if ( rowFilterer.filterOne(parsed) ) {
            filteredLoggerEntries.unshift(parsed);
            if ( parsed.voided ) {
                filteredLoggerEntryVoidedCount += 1;
            }
        }
    }

    const addedCount = filteredLoggerEntries.length - previousCount;
    if ( addedCount !== 0 ) {
        viewPort.updateContent(addedCount);
        rowJanitor.inserted(addedCount);
    }
};

/******************************************************************************/

const parseLogEntry = function(details) {
    // Patch realm until changed all over codebase to make this unnecessary
    if ( details.realm === 'cosmetic' ) {
        details.realm = 'extended';
    }

    const entry = new LogEntry(details);

    // Assemble the text content, i.e. the pre-built string which will be
    // used to match logger output filtering expressions.
    const textContent = [];

    // Cell 0
    logDate.setTime(details.tstamp - logDateTimezoneOffset);
    textContent.push(
        padTo2(logDate.getUTCHours()) + ':' +
        padTo2(logDate.getUTCMinutes()) + ':' +
        padTo2(logDate.getSeconds())
    );

    // Cell 1
    if ( details.realm === 'message' ) {
        textContent.push(details.text);
        entry.textContent = textContent.join('\t');
        return entry;
    }

    // Cell 1, 2
    if ( entry.filter !== undefined ) {
        textContent.push(entry.filter.raw);
        if ( entry.filter.result === 1 ) {
            textContent.push('--');
        } else if ( entry.filter.result === 2 ) {
            textContent.push('++');
        } else if ( entry.filter.result === 3 ) {
            textContent.push('**');
        } else if ( entry.filter.source === 'redirect' ) {
            textContent.push('<<');
        } else {
            textContent.push('');
        }
    } else {
        textContent.push('', '');
    }

    // Cell 3
    textContent.push(normalizeToStr(entry.docHostname));

    // Cell 4: partyness
    if (
        entry.realm === 'network' &&
        typeof entry.domain === 'string' &&
        entry.domain !== ''
    ) {
        let partyness = '';
        if ( entry.tabDomain !== undefined ) {
            if ( entry.tabId < 0 ) {
                partyness += '0,';
            }
            partyness += entry.domain === entry.tabDomain ? '1' : '3';
        } else {
            partyness += '?';
        }
        if ( entry.docDomain !== entry.tabDomain ) {
            partyness += ',';
            if ( entry.docDomain !== undefined ) {
                partyness += entry.domain === entry.docDomain ? '1' : '3';
            } else {
                partyness += '?';
            }
        }
        textContent.push(partyness);
    } else {
        textContent.push('');
    }

    // Cell 5
    textContent.push(
        normalizeToStr(prettyRequestTypes[entry.type] || entry.type)
    );

    // Cell 6
    textContent.push(normalizeToStr(details.url));

    // Hidden cells -- useful for row-filtering purpose

    // Cell 7
    if ( entry.aliased ) {
        textContent.push(`aliasURL=${details.aliasURL}`);
    }

    entry.textContent = textContent.join('\t');
    return entry;
};

/******************************************************************************/

const viewPort = (( ) => {
    const vwRenderer = qs$('#vwRenderer');
    const vwScroller = qs$('#vwScroller');
    const vwVirtualContent = qs$('#vwVirtualContent');
    const vwContent = qs$('#vwContent');
    const vwLineSizer = qs$('#vwLineSizer');
    const vwLogEntryTemplate = qs$('#logEntryTemplate > div');
    const vwEntries = [];

    const detailableRealms = new Set([ 'network', 'extended' ]);

    let vwHeight = 0;
    let lineHeight = 0;
    let wholeHeight = 0;
    let lastTopPix = 0;
    let lastTopRow = 0;
    let scrollTimer;
    let resizeTimer;

    const ViewEntry = function() {
        this.div = document.createElement('div');
        this.div.className = 'logEntry';
        vwContent.appendChild(this.div);
        this.logEntry = undefined;
    };
    ViewEntry.prototype = {
        dispose: function() {
            vwContent.removeChild(this.div);
        },
    };

    const rowFromScrollTopPix = function(px) {
        return lineHeight !== 0 ? Math.floor(px / lineHeight) : 0;
    };

    // This is called when the browser fired scroll events
    const onScrollChanged = function() {
        const newScrollTopPix = vwScroller.scrollTop;
        const delta = newScrollTopPix - lastTopPix;
        if ( delta === 0 ) { return; }
        lastTopPix = newScrollTopPix;
        if ( filteredLoggerEntries.length <= 2 ) { return; }
        // No entries were rolled = all entries keep their current details
        if ( rollLines(rowFromScrollTopPix(newScrollTopPix)) ) {
            fillLines();
        }
        positionLines();
        vwContent.style.top = `${lastTopPix}px`;
    };

    // Coalesce scroll events
    const onScroll = function() {
        if ( scrollTimer !== undefined ) { return; }
        scrollTimer = setTimeout(
            ( ) => {
                scrollTimer = requestAnimationFrame(( ) => {
                    scrollTimer = undefined;
                    onScrollChanged();
                });
            },
            1000/32
        );
    };

    dom.on(vwScroller, 'scroll', onScroll, { passive: true });

    const onLayoutChanged = function() {
        vwHeight = vwRenderer.clientHeight;
        vwContent.style.height = `${vwScroller.clientHeight}px`;

        const vExpanded =
            dom.cl.has('#netInspector .vCompactToggler', 'vExpanded');

        let newLineHeight = qs$(vwLineSizer, '.oneLine').clientHeight;

        if ( vExpanded ) {
            newLineHeight *= loggerSettings.linesPerEntry;
        }

        const lineCount = newLineHeight !== 0
            ? Math.ceil(vwHeight / newLineHeight) + 1
            : 0;
        if ( lineCount > vwEntries.length ) {
            do {
                vwEntries.push(new ViewEntry());
            } while ( lineCount > vwEntries.length );
        } else if ( lineCount < vwEntries.length ) {
            do {
                vwEntries.pop().dispose();
            } while ( lineCount < vwEntries.length );
        }

        const cellWidths = Array.from(
            qsa$(vwLineSizer, '.oneLine span')
        ).map((el, i) => {
            return loggerSettings.columns[i] !== false
                ? el.clientWidth + 1
                : 0;
        });
        const reservedWidth =
            cellWidths[0] + cellWidths[2] + cellWidths[4] + cellWidths[5];
        cellWidths[6] = 0.5;
        if ( cellWidths[1] === 0 && cellWidths[3] === 0 ) {
            cellWidths[6] = 1;
        } else if ( cellWidths[1] === 0 ) {
            cellWidths[3] = 0.35;
            cellWidths[6] = 0.65;
        } else if ( cellWidths[3] === 0 ) {
            cellWidths[1] = 0.35;
            cellWidths[6] = 0.65;
        } else {
            cellWidths[1] = 0.25;
            cellWidths[3] = 0.25;
            cellWidths[6] = 0.5;
        }
        const style = qs$('#vwRendererRuntimeStyles');
        const cssRules = [
            '#vwContent .logEntry {',
            `  height: ${newLineHeight}px;`,
            '}',
            '#vwContent .logEntry > div > span:nth-of-type(1) {',
            `  width: ${cellWidths[0]}px;`,
            '}',
            '#vwContent .logEntry > div > span:nth-of-type(2) {',
            `  width: calc(calc(100% - ${reservedWidth}px) * ${cellWidths[1]});`,
            '}',
            '#vwContent .logEntry > div.messageRealm > span:nth-of-type(2) {',
            `  width: calc(100% - ${cellWidths[0]}px);`,
            '}',
            '#vwContent .logEntry > div > span:nth-of-type(3) {',
            `  width: ${cellWidths[2]}px;`,
            '}',
            '#vwContent .logEntry > div > span:nth-of-type(4) {',
            `  width: calc(calc(100% - ${reservedWidth}px) * ${cellWidths[3]});`,
            '}',
            '#vwContent .logEntry > div > span:nth-of-type(5) {',
            `  width: ${cellWidths[4]}px;`,
            '}',
            '#vwContent .logEntry > div > span:nth-of-type(6) {',
            `  width: ${cellWidths[5]}px;`,
            '}',
            '#vwContent .logEntry > div > span:nth-of-type(7) {',
            `  width: calc(calc(100% - ${reservedWidth}px) * ${cellWidths[6]});`,
            '}',
            '',
        ];
        for ( let i = 0; i < cellWidths.length; i++ ) {
            if ( cellWidths[i] !== 0 ) { continue; }
            cssRules.push(
                `#vwContent .logEntry > div > span:nth-of-type(${i + 1}) {`,
                '  display: none;',
                '}'
            );
        }
        style.textContent = cssRules.join('\n');

        lineHeight = newLineHeight;
        positionLines();
        dom.cl.toggle('#netInspector', 'vExpanded', vExpanded);

        updateContent(0);
    };

    const updateLayout = function() {
        if ( resizeTimer !== undefined ) { return; }
        resizeTimer = setTimeout(
            ( ) => {
                resizeTimer = requestAnimationFrame(( ) => {
                    resizeTimer = undefined;
                    onLayoutChanged();
                });
            },
            1000/8
        );
    };

    dom.on(window, 'resize', updateLayout, { passive: true });

    updateLayout();

    const renderFilterToSpan = function(span, filter) {
        if ( filter.charCodeAt(0) !== 0x23 /* '#' */ ) { return false; }
        const match = /^#@?#/.exec(filter);
        if ( match === null ) { return false; }
        let child = document.createElement('span');
        child.textContent = match[0];
        span.appendChild(child);
        child = document.createElement('span');
        child.textContent = filter.slice(match[0].length);
        span.appendChild(child);
        return true;
    };

    const renderToDiv = function(vwEntry, i) {
        if ( i >= filteredLoggerEntries.length ) {
            vwEntry.logEntry = undefined;
            return null;
        }

        const details = filteredLoggerEntries[i];
        if ( vwEntry.logEntry === details ) {
            return vwEntry.div.firstElementChild;
        }

        vwEntry.logEntry = details;

        const cells = details.textContent.split('\t');
        const div = dom.clone(vwLogEntryTemplate);
        const divcl = div.classList;
        let span;

        // Realm
        if ( details.realm !== undefined ) {
            divcl.add(details.realm + 'Realm');
        }

        // Timestamp
        span = div.children[0];
        span.textContent = cells[0];

        // Tab id
        if ( details.tabId !== undefined ) {
            dom.attr(div, 'data-tabid', details.tabId);
            if ( details.voided ) {
                divcl.add('voided');
            }
        }

        if ( details.realm === 'message' ) {
            if ( details.type !== undefined ) {
                dom.attr(div, 'data-type', details.type);
            }
            span = div.children[1];
            span.textContent = cells[1];
            return div;
        }

        if ( detailableRealms.has(details.realm) ) {
            divcl.add('canDetails');
        }

        // Filter
        const filter = details.filter || undefined;
        let filteringType;
        if ( filter !== undefined ) {
            if ( typeof filter.source === 'string' ) {
                filteringType = filter.source;
            }
            if ( filteringType === 'static' ) {
                divcl.add('canLookup');
            } else if ( details.realm === 'extended' ) {
                divcl.toggle('canLookup', /^#@?#/.test(filter.raw));
                divcl.toggle('isException', filter.raw.startsWith('#@#'));
            }
            if ( filter.modifier === true ) {
                dom.attr(div, 'data-modifier', '');
            }
        }
        span = div.children[1];
        if ( renderFilterToSpan(span, cells[1]) === false ) {
            span.textContent = cells[1];
        }

        // Event
        if ( cells[2] === '--' ) {
            dom.attr(div, 'data-status', '1');
        } else if ( cells[2] === '++' ) {
            dom.attr(div, 'data-status', '2');
        } else if ( cells[2] === '**' ) {
            dom.attr(div, 'data-status', '3');
        } else if ( cells[2] === '<<' ) {
            divcl.add('redirect');
        }
        span = div.children[2];
        span.textContent = cells[2];

        // Origins
        if ( details.tabHostname ) {
            dom.attr(div, 'data-tabhn', details.tabHostname);
        }
        if ( details.docHostname ) {
            dom.attr(div, 'data-dochn', details.docHostname);
        }
        span = div.children[3];
        span.textContent = cells[3];

        // Partyness
        if (
            cells[4] !== '' &&
            details.realm === 'network' &&
            details.domain !== undefined
        ) {
            let text = `${details.tabDomain}`;
            if ( details.docDomain !== details.tabDomain ) {
                text += ` \u22ef ${details.docDomain}`;
            }
            text += ` \u21d2 ${details.domain}`;
            dom.attr(div, 'data-parties', text);
        }
        span = div.children[4];
        span.textContent = cells[4];

        // Type
        span = div.children[5];
        span.textContent = cells[5];

        // URL
        let re;
        if ( filteringType === 'static' ) {
            re = new RegExp(filter.regex, 'gi');
        } else if ( filteringType === 'dynamicUrl' ) {
            re = regexFromURLFilteringResult(filter.rule.join(' '));
        }
        nodeFromURL(div.children[6], cells[6], re);

        // Alias URL (CNAME, etc.)
        if ( cells.length > 7 ) {
            const pos = details.textContent.lastIndexOf('\taliasURL=');
            if ( pos !== -1 ) {
                dom.attr(div, 'data-aliasid', details.id);
            }
        }

        return div;
    };

    // The idea is that positioning DOM elements is faster than
    // removing/inserting DOM elements.
    const positionLines = function() {
        if ( lineHeight === 0 ) { return; }
        let y = -(lastTopPix % lineHeight);
        for ( const vwEntry of vwEntries ) {
            vwEntry.div.style.top = `${y}px`;
            y += lineHeight;
        }
    };

    const rollLines = function(topRow) {
        let delta = topRow - lastTopRow;
        let deltaLength = Math.abs(delta);
        // No point rolling if no rows can be reused
        if ( deltaLength > 0 && deltaLength < vwEntries.length ) {
            if ( delta < 0 ) {      // Move bottom rows to the top
                vwEntries.unshift(...vwEntries.splice(delta));
            } else {                // Move top rows to the bottom
                vwEntries.push(...vwEntries.splice(0, delta));
            }
        }
        lastTopRow = topRow;
        return delta;
    };

    const fillLines = function() {
        let rowBeg = lastTopRow;
        for ( const vwEntry of vwEntries ) {
            const newDiv = renderToDiv(vwEntry, rowBeg);
            const container = vwEntry.div;
            const oldDiv = container.firstElementChild;
            if ( newDiv !== null ) {
                if ( oldDiv === null ) {
                    container.appendChild(newDiv);
                } else if ( newDiv !== oldDiv ) {
                    container.removeChild(oldDiv);
                    container.appendChild(newDiv);
                }
            } else if ( oldDiv !== null ) {
                container.removeChild(oldDiv);
            }
            rowBeg += 1;
        }
    };

    const contentChanged = function(addedCount) {
        lastTopRow += addedCount;
        const newWholeHeight = Math.max(
            filteredLoggerEntries.length * lineHeight,
            vwRenderer.clientHeight
        );
        if ( newWholeHeight !== wholeHeight ) {
            vwVirtualContent.style.height = `${newWholeHeight}px`;
            wholeHeight = newWholeHeight;
        }
    };

    const updateContent = function(addedCount) {
        contentChanged(addedCount);
        // Content changed
        if ( addedCount === 0 ) {
            if (
                lastTopRow !== 0 &&
                lastTopRow + vwEntries.length > filteredLoggerEntries.length
            ) {
                lastTopRow = filteredLoggerEntries.length - vwEntries.length;
                if ( lastTopRow < 0 ) { lastTopRow = 0; }
                lastTopPix = lastTopRow * lineHeight;
                vwContent.style.top = `${lastTopPix}px`;
                vwScroller.scrollTop = lastTopPix;
                positionLines();
            }
            fillLines();
            return;
        }

        // Content added
        // Preserve scroll position
        if ( lastTopPix === 0 ) {
            rollLines(0);
            positionLines();
            fillLines();
            return;
        }

        // Preserve row position
        lastTopPix += lineHeight * addedCount;
        vwContent.style.top = `${lastTopPix}px`;
        vwScroller.scrollTop = lastTopPix;
    };

    return { updateContent, updateLayout, };
})();

/******************************************************************************/

const updateCurrentTabTitle = (( ) => {
    const i18nCurrentTab = i18n$('loggerCurrentTab');

    return function() {
        const select = qs$('#pageSelector');
        if ( select.value !== '_' || activeTabId === 0 ) { return; }
        const opt0 = qs$(select, '[value="_"]');
        const opt1 = qs$(select, `[value="${activeTabId}"]`);
        let text = i18nCurrentTab;
        if ( opt1 !== null ) {
            text += ' / ' + opt1.textContent;
        }
        opt0.textContent = text;
    };
})();

/******************************************************************************/

const synchronizeTabIds = function(newTabIds) {
    const select = qs$('#pageSelector');
    const selectedTabValue = select.value;
    const oldTabIds = allTabIds;

    // Collate removed tab ids.
    const toVoid = new Set();
    for ( const tabId of oldTabIds.keys() ) {
        if ( newTabIds.has(tabId) ) { continue; }
        toVoid.add(tabId);
    }
    allTabIds = newTabIds;

    // Mark as "void" all logger entries which are linked to now invalid
    // tab ids.
    // When an entry is voided without being removed, we re-create a new entry
    // in order to ensure the entry has a new identity. A new identify ensures
    // that identity-based associations elsewhere are automatically
    // invalidated.
    if ( toVoid.size !== 0 ) {
        const autoDeleteVoidedRows = selectedTabValue === '_';
        let rowVoided = false;
        for ( let i = 0, n = loggerEntries.length; i < n; i++ ) {
            const entry = loggerEntries[i];
            if ( toVoid.has(entry.tabId) === false ) { continue; }
            if ( entry.voided ) { continue; }
            rowVoided = entry.voided = true;
            if ( autoDeleteVoidedRows ) {
                entry.dead = true;
            }
            loggerEntries[i] = new LogEntry(entry);
        }
        if ( rowVoided ) {
            rowFilterer.filterAll();
        }
    }

    // Remove popup if it is currently bound to a removed tab.
    if ( toVoid.has(popupManager.tabId) ) {
        popupManager.toggleOff();
    }

    const tabIds = Array.from(newTabIds.keys()).sort(function(a, b) {
        return newTabIds.get(a).localeCompare(newTabIds.get(b));
    });
    let j = 3;
    for ( let i = 0; i < tabIds.length; i++ ) {
        const tabId = tabIds[i];
        if ( tabId <= 0 ) { continue; }
        if ( j === select.options.length ) {
            select.appendChild(document.createElement('option'));
        }
        const option = select.options[j];
        // Truncate too long labels.
        option.textContent = newTabIds.get(tabId).slice(0, 80);
        dom.attr(option, 'value', tabId);
        if ( option.value === selectedTabValue ) {
            select.selectedIndex = j;
            dom.attr(option, 'selected', '');
        } else {
            dom.attr(option, 'selected', null);
        }
        j += 1;
    }
    while ( j < select.options.length ) {
        select.removeChild(select.options[j]);
    }
    if ( select.value !== selectedTabValue ) {
        select.selectedIndex = 0;
        select.value = '';
        dom.attr(select.options[0], 'selected', '');
        pageSelectorChanged();
    }

    updateCurrentTabTitle();
};

/******************************************************************************/

const onLogBufferRead = function(response) {
    if ( !response || response.unavailable ) { return; }

    // Disable tooltips?
    if (
        popupLoggerTooltips === undefined &&
        response.tooltips !== undefined
    ) {
        popupLoggerTooltips = response.tooltips;
        if ( popupLoggerTooltips === false ) {
            dom.attr('[data-i18n-title]', 'title', '');
        }
    }

    // Tab id of currently active tab
    let activeTabIdChanged = false;
    if ( response.activeTabId ) {
        activeTabIdChanged = response.activeTabId !== activeTabId;
        activeTabId = response.activeTabId;
    }

    if ( Array.isArray(response.tabIds) ) {
        response.tabIds = new Map(response.tabIds);
    }

    // List of tab ids has changed
    if ( response.tabIds !== undefined ) {
        synchronizeTabIds(response.tabIds);
        allTabIdsToken = response.tabIdsToken;
    }

    filterAuthorMode = response.filterAuthorMode === true;

    if ( activeTabIdChanged ) {
        pageSelectorFromURLHash();
    }

    processLoggerEntries(response);

    // Synchronize DOM with sent logger data
    dom.cl.toggle(dom.html, 'colorBlind', response.colorBlind === true);
    dom.cl.toggle('#clean', 'disabled', filteredLoggerEntryVoidedCount === 0);
    dom.cl.toggle('#clear', 'disabled', filteredLoggerEntries.length === 0);
};

/******************************************************************************/

const readLogBuffer = (( ) => {
    let timer;

    const readLogBufferNow = async function() {
        if ( logger.ownerId === undefined ) { return; }

        const msg = {
            what: 'readAll',
            ownerId: logger.ownerId,
            tabIdsToken: allTabIdsToken,
        };

        // This is to detect changes in the position or size of the logger
        // popup window (if in use).
        if (
            popupLoggerBox instanceof Object &&
            (
                self.screenX !== popupLoggerBox.x ||
                self.screenY !== popupLoggerBox.y ||
                self.outerWidth !== popupLoggerBox.w ||
                self.outerHeight !== popupLoggerBox.h
            )
        ) {
            popupLoggerBox.x = self.screenX;
            popupLoggerBox.y = self.screenY;
            popupLoggerBox.w = self.outerWidth;
            popupLoggerBox.h = self.outerHeight;
            msg.popupLoggerBoxChanged = true;
        }

        const response = await vAPI.messaging.send('loggerUI', msg);

        timer = undefined;
        onLogBufferRead(response);
        readLogBufferLater();
    };

    const readLogBufferLater = function() {
        if ( timer !== undefined ) { return; }
        if ( logger.ownerId === undefined ) { return; }
        timer = vAPI.setTimeout(readLogBufferNow, 1200);
    };

    readLogBufferNow();

    return readLogBufferLater;
})();
 
/******************************************************************************/

const pageSelectorChanged = function() {
    const select = qs$('#pageSelector');
    window.location.replace('#' + select.value);
    pageSelectorFromURLHash();
};

const pageSelectorFromURLHash = (( ) => {
    let lastHash;
    let lastSelectedTabId;

    return function() {
        let hash = window.location.hash.slice(1);
        let match = /^([^+]+)\+(.+)$/.exec(hash);
        if ( match !== null ) {
            hash = match[1];
            activeTabId = parseInt(match[2], 10) || 0;
            window.location.hash = '#' + hash;
        }

        if ( hash !== lastHash ) {
            const select = qs$('#pageSelector');
            let option = qs$(select, `option[value="${hash}"]`);
            if ( option === null ) {
                hash = '0';
                option = select.options[0];
            }
            select.selectedIndex = option.index;
            select.value = option.value;
            lastHash = hash;
        }

        selectedTabId = hash === '_'
            ? activeTabId
            : parseInt(hash, 10) || 0;

        if ( lastSelectedTabId === selectedTabId ) { return; }

        rowFilterer.filterAll();
        document.dispatchEvent(new Event('tabIdChanged'));
        updateCurrentTabTitle();
        dom.cl.toggle('.needdom', 'disabled', selectedTabId <= 0);
        dom.cl.toggle('.needscope', 'disabled', selectedTabId <= 0);
        lastSelectedTabId = selectedTabId;
    };
})();

/******************************************************************************/

const reloadTab = function(ev) {
    const tabId = tabIdFromPageSelector();
    if ( tabId <= 0 ) { return; }
    messaging.send('loggerUI', {
        what: 'reloadTab',
        tabId: tabId,
        bypassCache: ev && (ev.ctrlKey || ev.metaKey || ev.shiftKey),
    });
};

/******************************************************************************/
/******************************************************************************/

(( ) => {
    const reRFC3986 = /^([^:\/?#]+:)?(\/\/[^\/?#]*)?([^?#]*)(\?[^#]*)?(#.*)?/;
    const reSchemeOnly = /^[\w-]+:$/;
    const staticFilterTypes = {
        'beacon': 'ping',
        'doc': 'document',
        'css': 'stylesheet',
        'frame': 'subdocument',
        'object_subrequest': 'object',
        'csp_report': 'other',
    };
    const createdStaticFilters = {};
    const reIsExceptionFilter = /^@@|^[\w.-]*?#@#/;

    let dialog = null;
    let targetRow = null;
    let targetType;
    let targetURLs = [];
    let targetFrameHostname;
    let targetPageHostname;
    let targetTabId;
    let targetDomain;
    let targetPageDomain;
    let targetFrameDomain;

    const uglyTypeFromSelector = pane => {
        const prettyType = selectValue('select.type.' + pane);
        if ( pane === 'static' ) {
            return staticFilterTypes[prettyType] || prettyType;
        }
        return uglyRequestTypes[prettyType] || prettyType;
    };

    const selectNode = selector => {
        return qs$(dialog, selector);
    };

    const selectValue = selector => {
        return selectNode(selector).value || '';
    };

    const staticFilterNode = ( ) => {
        return qs$(dialog, 'div.panes > div.static textarea');
    };

    const toExceptionFilter = (filter, extended) => {
        if ( reIsExceptionFilter.test(filter) ) { return filter; }
        return extended ? filter.replace('##', '#@#') : `@@${filter}`;
    };

    const onColorsReady = function(response) {
        dom.cl.toggle(dom.body, 'dirty', response.dirty);
        for ( const url in response.colors ) {
            if ( response.colors.hasOwnProperty(url) === false ) { continue; }
            const colorEntry = response.colors[url];
            const node = qs$(dialog, `.dynamic .entry .action[data-url="${url}"]`);
            if ( node === null ) { continue; }
            dom.cl.toggle(node, 'allow', colorEntry.r === 2);
            dom.cl.toggle(node, 'noop', colorEntry.r === 3);
            dom.cl.toggle(node, 'block', colorEntry.r === 1);
            dom.cl.toggle(node, 'own', colorEntry.own);
        }
    };

    const colorize = async function() {
        const response = await messaging.send('loggerUI', {
            what: 'getURLFilteringData',
            context: selectValue('select.dynamic.origin'),
            urls: targetURLs,
            type: uglyTypeFromSelector('dynamic'),
        });
        onColorsReady(response);
    };

    const parseStaticInputs = function() {
        const options = [];
        const block = selectValue('select.static.action') === '';
        let filter = '';
        if ( !block ) {
            filter = '@@';
        }
        let value = selectValue('select.static.url');
        if ( value !== '' ) {
            if ( reSchemeOnly.test(value) ) {
                value = `|${value}`;
            } else {
                if ( value.endsWith('/') ) {
                    value += '*';
                } else if ( /[/?]/.test(value) === false ) {
                    value += '^';
                }
                value = `||${value}`;
            }
        }
        filter += value;
        value = selectValue('select.static.type');
        if ( value !== '' ) {
            options.push(uglyTypeFromSelector('static'));
        }
        value = selectValue('select.static.origin');
        if ( value !== '' ) {
            if ( value === targetDomain ) {
                options.push('1p');
            } else {
                options.push('domain=' + value);
            }
        }
        if ( block && selectValue('select.static.importance') !== '' ) {
            options.push('important');
        }
        if ( options.length ) {
            filter += '$' + options.join(',');
        }
        staticFilterNode().value = filter;
        updateWidgets();
    };

    const updateWidgets = function() {
        const value = staticFilterNode().value;
        dom.cl.toggle(
            qs$(dialog, '#createStaticFilter'),
            'disabled',
            createdStaticFilters.hasOwnProperty(value) || value === ''
        );
    };

    const onClick = async function(ev) {
        const target = ev.target;
        const tcl = target.classList;

        // Select a mode
        if ( tcl.contains('header') ) {
            ev.stopPropagation();
            dom.attr(dialog, 'data-pane', dom.attr(target, 'data-pane'));
            return;
        }

        // Toggle temporary exception filter
        if ( tcl.contains('exceptor') ) {
            ev.stopPropagation();
            const filter = filterFromTargetRow();
            const status = await messaging.send('loggerUI', {
                what: 'toggleInMemoryFilter',
                filter: toExceptionFilter(filter, dom.cl.has(targetRow, 'extendedRealm')),
            });
            const row = target.closest('div');
            dom.cl.toggle(row, 'exceptored', status);
            return;
        }
        
        // Create static filter
        if ( target.id === 'createStaticFilter' ) {
            ev.stopPropagation();
            const value = staticFilterNode().value;
            // Avoid duplicates
            if ( createdStaticFilters.hasOwnProperty(value) ) { return; }
            createdStaticFilters[value] = true;
            // https://github.com/uBlockOrigin/uBlock-issues/issues/1281#issuecomment-704217175
            // TODO:
            //   Figure a way to use the actual document URL. Currently using
            //   a synthetic URL derived from the document hostname.
            if ( value !== '' ) {
                messaging.send('loggerUI', {
                    what: 'createUserFilter',
                    autoComment: true,
                    filters: value,
                    docURL: `https://${targetFrameHostname}/`,
                });
            }
            updateWidgets();
            return;
        }

        // Save url filtering rule(s)
        if ( target.id === 'saveRules' ) {
            ev.stopPropagation();
            await messaging.send('loggerUI', {
                what: 'saveURLFilteringRules',
                context: selectValue('select.dynamic.origin'),
                urls: targetURLs,
                type: uglyTypeFromSelector('dynamic'),
            });
            colorize();
            return;
        }

        const persist = !!ev.ctrlKey || !!ev.metaKey;

        // Remove url filtering rule
        if ( tcl.contains('action') ) {
            ev.stopPropagation();
            await messaging.send('loggerUI', {
                what: 'setURLFilteringRule',
                context: selectValue('select.dynamic.origin'),
                url: dom.attr(target, 'data-url'),
                type: uglyTypeFromSelector('dynamic'),
                action: 0,
                persist: persist,
            });
            colorize();
            return;
        }

        // add "allow" url filtering rule
        if ( tcl.contains('allow') ) {
            ev.stopPropagation();
            await messaging.send('loggerUI', {
                what: 'setURLFilteringRule',
                context: selectValue('select.dynamic.origin'),
                url: dom.attr(target.parentNode, 'data-url'),
                type: uglyTypeFromSelector('dynamic'),
                action: 2,
                persist: persist,
            });
            colorize();
            return;
        }

        // add "block" url filtering rule
        if ( tcl.contains('noop') ) {
            ev.stopPropagation();
            await messaging.send('loggerUI', {
                what: 'setURLFilteringRule',
                context: selectValue('select.dynamic.origin'),
                url: dom.attr(target.parentNode, 'data-url'),
                type: uglyTypeFromSelector('dynamic'),
                action: 3,
                persist: persist,
            });
            colorize();
            return;
        }

        // add "block" url filtering rule
        if ( tcl.contains('block') ) {
            ev.stopPropagation();
            await messaging.send('loggerUI', {
                what: 'setURLFilteringRule',
                context: selectValue('select.dynamic.origin'),
                url: dom.attr(target.parentNode, 'data-url'),
                type: uglyTypeFromSelector('dynamic'),
                action: 1,
                persist: persist,
            });
            colorize();
            return;
        }

        // Force a reload of the tab
        if ( tcl.contains('reload') ) {
            ev.stopPropagation();
            messaging.send('loggerUI', {
                what: 'reloadTab',
                tabId: targetTabId,
            });
            return;
        }

        // Highlight corresponding element in target web page
        if ( tcl.contains('picker') ) {
            ev.stopPropagation();
            messaging.send('loggerUI', {
                what: 'launchElementPicker',
                tabId: targetTabId,
                targetURL: 'img\t' + targetURLs[0],
                select: true,
            });
            return;
        }
    };

    const onSelectChange = function(ev) {
        const tcl = ev.target.classList;

        if ( tcl.contains('dynamic') ) {
            colorize();
            return;
        }

        if ( tcl.contains('static') ) {
            parseStaticInputs();
            return;
        }
    };

    const onInputChange = function() {
        updateWidgets();
    };

    const createPreview = function(type, url) {
        const cantPreview =
            type !== 'image' ||
            dom.cl.has(targetRow, 'networkRealm') === false  ||
            dom.attr(targetRow, 'data-status') === '1';

        // Whether picker can be used
        dom.cl.toggle(
            qs$(dialog, '.picker'),
            'hide',
            targetTabId < 0 || cantPreview
        );

        // Whether the resource can be previewed
        if ( cantPreview ) { return; }

        const container = qs$(dialog, '.preview');
        dom.on(qs$(container, 'span'), 'click', ( ) => {
            const preview = dom.create('img');
            dom.attr(preview, 'src', url);
            container.replaceChild(preview, container.firstElementChild);
        }, { once: true });

        dom.cl.remove(container, 'hide');
    };

    // https://github.com/gorhill/uBlock/issues/1511
    const shortenLongString = function(url, max) {
        const urlLen = url.length;
        if ( urlLen <= max ) {
            return url;
        }
        const n = urlLen - max - 1;
        const i = (urlLen - n) / 2 | 0;
        return url.slice(0, i) + '…' + url.slice(i + n);
    };

    // Build list of candidate URLs
    const createTargetURLs = function(url) {
        const matches = reRFC3986.exec(url);
        if ( matches === null ) { return []; }
        if ( typeof matches[2] !== 'string' || matches[2].length === 0 ) {
            return [ matches[1] ];
        }
        // Shortest URL for a valid URL filtering rule
        const urls = [];
        const rootURL = matches[1] + matches[2];
        urls.unshift(rootURL);
        const path = matches[3] || '';
        let pos = path.charAt(0) === '/' ? 1 : 0;
        while ( pos < path.length ) {
            pos = path.indexOf('/', pos);
            if ( pos === -1 ) {
                pos = path.length;
            } else {
                pos += 1;
            }
            urls.unshift(rootURL + path.slice(0, pos));
        }
        const query = matches[4] || '';
        if ( query !== '' ) {
            urls.unshift(rootURL + path + query);
        }
        return urls;
    };

    const filterFromTargetRow = function() {
        return dom.text(targetRow.children[1]);
    };

    const aliasURLFromID = function(id) {
        if ( id === '' ) { return ''; }
        for ( const entry of loggerEntries ) {
            if ( entry.id !== id || entry.aliased ) { continue; }
            const fields = entry.textContent.split('\t');
            return fields[6] || '';
        }
        return '';
    };

    const toSummaryPaneFilterNode = async function(receiver, filter) {
        receiver.children[1].textContent = filter;
        if ( dom.cl.has(targetRow, 'canLookup') === false ) { return; }
        const isException = reIsExceptionFilter.test(filter);
        let isExcepted = false;
        if ( isException ) {
            isExcepted = await messaging.send('loggerUI', {
                what: 'hasInMemoryFilter',
                filter: toExceptionFilter(filter, dom.cl.has(targetRow, 'extendedRealm')),
            });
        }
        if ( isException && isExcepted === false ) { return; }
        dom.cl.toggle(receiver, 'exceptored', isExcepted);
        receiver.children[2].style.visibility = '';
    };

    const fillSummaryPaneFilterList = async function(rows) {
        const rawFilter = targetRow.children[1].textContent;

        const nodeFromFilter = function(filter, lists) {
            const fragment = document.createDocumentFragment();
            const template = qs$('#filterFinderListEntry > span');
            for ( const list of lists ) {
                const span = dom.clone(template);
                let a = qs$(span, 'a:nth-of-type(1)');
                a.href += encodeURIComponent(list.assetKey);
                a.textContent = list.title;
                a = qs$(span, 'a:nth-of-type(2)');
                if ( list.supportURL ) {
                    dom.attr(a, 'href', list.supportURL);
                } else {
                    a.style.display = 'none';
                }
                if ( fragment.childElementCount !== 0 ) {
                    fragment.appendChild(document.createTextNode('\n'));
                }
                fragment.appendChild(span);
            }
            return fragment;
        };

        const handleResponse = function(response) {
            if ( response instanceof Object === false ) {
                response = {};
            }
            let bestMatchFilter = '';
            for ( const filter in response ) {
                if ( filter.length > bestMatchFilter.length ) {
                    bestMatchFilter = filter;
                }
            }
            if (
                bestMatchFilter !== '' &&
                Array.isArray(response[bestMatchFilter])
            ) {
                toSummaryPaneFilterNode(rows[0], bestMatchFilter);
                rows[1].children[1].appendChild(nodeFromFilter(
                    bestMatchFilter,
                    response[bestMatchFilter]
                ));
            }
            // https://github.com/gorhill/uBlock/issues/2179
            if ( rows[1].children[1].childElementCount === 0 ) {
                i18n.safeTemplateToDOM(
                    'loggerStaticFilteringFinderSentence2',
                    { filter: rawFilter },
                    rows[1].children[1]
                );
            }
        };

        if ( dom.cl.has(targetRow, 'networkRealm') ) {
            const response = await messaging.send('loggerUI', {
                what: 'listsFromNetFilter',
                rawFilter: rawFilter,
            });
            handleResponse(response);
        } else if ( dom.cl.has(targetRow, 'extendedRealm') ) {
            const response = await messaging.send('loggerUI', {
                what: 'listsFromCosmeticFilter',
                url: targetRow.children[6].textContent,
                rawFilter: rawFilter,
            });
            handleResponse(response);
        }
    };

    const fillSummaryPane = function() {
        const rows = qsa$(dialog, '.pane.details > div');
        const tr = targetRow;
        const trcl = tr.classList;
        const trch = tr.children;
        let text;
        // Filter and context
        text = filterFromTargetRow();
        if (
            (text !== '') &&
            (trcl.contains('extendedRealm') || trcl.contains('networkRealm'))
        ) {
            toSummaryPaneFilterNode(rows[0], text);
        } else {
            rows[0].style.display = 'none';
        }
        // Rule
        if (
            (text !== '') &&
            (
                trcl.contains('dynamicHost') ||
                trcl.contains('dynamicUrl') ||
                trcl.contains('switchRealm')
            )
        ) {
            rows[2].children[1].textContent = text;
        } else {
            rows[2].style.display = 'none';
        }
        // Filter list
        if ( trcl.contains('canLookup') ) {
            fillSummaryPaneFilterList(rows);
        } else {
            rows[1].style.display = 'none';
        }
        // Root and immediate contexts
        const tabhn = dom.attr(tr, 'data-tabhn') || '';
        const dochn = dom.attr(tr, 'data-dochn') || '';
        if ( tabhn !== '' && tabhn !== dochn ) {
            rows[3].children[1].textContent = tabhn;
        } else {
            rows[3].style.display = 'none';
        }
        if ( dochn !== '' ) {
            rows[4].children[1].textContent = dochn;
        } else {
            rows[4].style.display = 'none';
        }
        // Partyness
        text = dom.attr(tr, 'data-parties') || '';
        if ( text !== '' ) {
            rows[5].children[1].textContent = `(${trch[4].textContent})\u2002${text}`;
        } else {
            rows[5].style.display = 'none';
        }
        // Type
        text = trch[5].textContent;
        if ( text !== '' ) {
            rows[6].children[1].textContent = text;
        } else {
            rows[6].style.display = 'none';
        }
        // URL
        const canonicalURL = trch[6].textContent;
        if ( canonicalURL !== '' ) {
            const attr = dom.attr(tr, 'data-status') || '';
            if ( attr !== '' ) {
                dom.attr(rows[7], 'data-status', attr);
                if ( tr.hasAttribute('data-modifier') ) {
                    dom.attr(rows[7], 'data-modifier', '');
                }
            }
            rows[7].children[1].appendChild(dom.clone(trch[6]));
        } else {
            rows[7].style.display = 'none';
        }
        // Alias URL
        text = dom.attr(tr, 'data-aliasid');
        const aliasURL = text ? aliasURLFromID(text) : '';
        if ( aliasURL !== '' ) {
            rows[8].children[1].textContent =
                hostnameFromURI(aliasURL) + ' \u21d2\n\u2003' +
                hostnameFromURI(canonicalURL);
            rows[9].children[1].textContent = aliasURL;
        } else {
            rows[8].style.display = 'none';
            rows[9].style.display = 'none';
        }
    };

    // Fill dynamic URL filtering pane
    const fillDynamicPane = function() {
        if ( dom.cl.has(targetRow, 'extendedRealm') ) { return; }

        // https://github.com/uBlockOrigin/uBlock-issues/issues/662#issuecomment-509220702
        if ( targetType === 'doc' ) { return; }

        // https://github.com/gorhill/uBlock/issues/2469
        if ( targetURLs.length === 0 || reSchemeOnly.test(targetURLs[0]) ) {
            return;
        }

        // Fill context selector
        let select = selectNode('select.dynamic.origin');
        fillOriginSelect(select, targetPageHostname, targetPageDomain);
        const option = document.createElement('option');
        option.textContent = '*';
        dom.attr(option, 'value', '*');
        select.appendChild(option);

        // Fill type selector
        select = selectNode('select.dynamic.type');
        select.options[0].textContent = targetType;
        dom.attr(select.options[0], 'value', targetType);
        select.selectedIndex = 0;

        // Fill entries
        const menuEntryTemplate = qs$(dialog, '.dynamic .toolbar .entry');
        const tbody = qs$(dialog, '.dynamic .entries');
        for ( const targetURL of  targetURLs ) {
            const menuEntry = dom.clone(menuEntryTemplate);
            dom.attr(menuEntry.children[0], 'data-url', targetURL);
            menuEntry.children[1].textContent = shortenLongString(targetURL, 128);
            tbody.appendChild(menuEntry);
        }

        colorize();
    };

    const fillOriginSelect = function(select, hostname, domain) {
        const template = i18n$('loggerStaticFilteringSentencePartOrigin');
        let value = hostname;
        for (;;) {
            const option = document.createElement('option');
            dom.attr(option, 'value', value);
            option.textContent = template.replace('{{origin}}', value);
            select.appendChild(option);
            if ( value === domain ) { break; }
            const pos = value.indexOf('.');
            if ( pos === -1 ) { break; }
            value = value.slice(pos + 1);
        }
    };

    // Fill static filtering pane
    const fillStaticPane = function() {
        if ( dom.cl.has(targetRow, 'extendedRealm') ) { return; }

        const template = i18n$('loggerStaticFilteringSentence');
        const rePlaceholder = /\{\{[^}]+?\}\}/g;
        const nodes = [];
        let pos = 0;
        for (;;) {
            const match = rePlaceholder.exec(template);
            if ( match === null ) { break; }
            if ( pos !== match.index ) {
                nodes.push(document.createTextNode(template.slice(pos, match.index)));
            }
            pos = rePlaceholder.lastIndex;
            let select, option;
            switch ( match[0] ) {
            case '{{br}}':
                nodes.push(document.createElement('br'));
                break;

            case '{{action}}':
                select = document.createElement('select');
                select.className = 'static action';
                option = document.createElement('option');
                dom.attr(option, 'value', '');
                option.textContent = i18n$('loggerStaticFilteringSentencePartBlock');
                select.appendChild(option);
                option = document.createElement('option');
                dom.attr(option, 'value', '@@');
                option.textContent = i18n$('loggerStaticFilteringSentencePartAllow');
                select.appendChild(option);
                nodes.push(select);
                break;

            case '{{type}}': {
                const filterType = staticFilterTypes[targetType] || targetType;
                select = document.createElement('select');
                select.className = 'static type';
                option = document.createElement('option');
                dom.attr(option, 'value', filterType);
                option.textContent = i18n$('loggerStaticFilteringSentencePartType').replace('{{type}}', filterType);
                select.appendChild(option);
                option = document.createElement('option');
                dom.attr(option, 'value', '');
                option.textContent = i18n$('loggerStaticFilteringSentencePartAnyType');
                select.appendChild(option);
                nodes.push(select);
                break;
            }
            case '{{url}}':
                select = document.createElement('select');
                select.className = 'static url';
                for ( const targetURL of targetURLs ) {
                    const value = targetURL.replace(/^[a-z-]+:\/\//, '');
                    option = document.createElement('option');
                    dom.attr(option, 'value', value);
                    option.textContent = shortenLongString(value, 128);
                    select.appendChild(option);
                }
                nodes.push(select);
                break;

            case '{{origin}}':
                select = document.createElement('select');
                select.className = 'static origin';
                fillOriginSelect(select, targetFrameHostname, targetFrameDomain);
                option = document.createElement('option');
                dom.attr(option, 'value', '');
                option.textContent = i18n$('loggerStaticFilteringSentencePartAnyOrigin');
                select.appendChild(option);
                nodes.push(select);
                break;

            case '{{importance}}':
                select = document.createElement('select');
                select.className = 'static importance';
                option = document.createElement('option');
                dom.attr(option, 'value', '');
                option.textContent = i18n$('loggerStaticFilteringSentencePartNotImportant');
                select.appendChild(option);
                option = document.createElement('option');
                dom.attr(option, 'value', 'important');
                option.textContent = i18n$('loggerStaticFilteringSentencePartImportant');
                select.appendChild(option);
                nodes.push(select);
                break;

            default:
                break;
            }
        }
        if ( pos < template.length ) {
            nodes.push(document.createTextNode(template.slice(pos)));
        }
        const parent = qs$(dialog, 'div.panes > .static > div:first-of-type');
        for ( let i = 0; i < nodes.length; i++ ) {
            parent.appendChild(nodes[i]);
        }
        parseStaticInputs();
    };

    const fillDialog = function(domains) {
        dialog = modalDialog.create(
            '#netFilteringDialog',
            ( ) => {
                targetURLs = [];
                targetRow = null;
                dialog = null;
            }
        );
        dom.cl.toggle(
            dialog,
            'extendedRealm',
            dom.cl.has(targetRow, 'extendedRealm')
        );
        targetDomain = domains[0];
        targetPageDomain = domains[1];
        targetFrameDomain = domains[2];
        createPreview(targetType, targetURLs[0]);
        fillSummaryPane();
        fillDynamicPane();
        fillStaticPane();
        dom.on(dialog, 'click', ev => { onClick(ev); }, true);
        dom.on(dialog, 'change', onSelectChange, true);
        dom.on(dialog, 'input', onInputChange, true);
        modalDialog.show();
    };

    const toggleOn = async function(ev) {
        targetRow = ev.target.closest('.canDetails');
        if ( targetRow === null ) { return; }
        ev.stopPropagation();
        targetTabId = tabIdFromAttribute(targetRow);
        targetType = targetRow.children[5].textContent.trim() || '';
        targetURLs = createTargetURLs(targetRow.children[6].textContent);
        targetPageHostname = dom.attr(targetRow, 'data-tabhn') || '';
        targetFrameHostname = dom.attr(targetRow, 'data-dochn') || '';

        // We need the root domain names for best user experience.
        const domains = await messaging.send('loggerUI', {
            what: 'getDomainNames',
            targets: [
                targetURLs[0],
                targetPageHostname,
                targetFrameHostname
            ],
        });
        fillDialog(domains);
    };

    dom.on(
        '#netInspector',
        'click',
        '.canDetails > span:nth-of-type(2),.canDetails > span:nth-of-type(3),.canDetails > span:nth-of-type(5)',
        ev => { toggleOn(ev); }
    );
})();

/******************************************************************************/
/******************************************************************************/

const rowFilterer = (( ) => {
    const userFilters = [];
    const builtinFilters = [];

    let masterFilterSwitch = true;
    let filters = [];

    const parseInput = function() {
        userFilters.length = 0;

        const rawParts = qs$('#filterInput > input').value.trim().split(/\s+/);
        const n = rawParts.length;
        const reStrs = [];
        let not = false;
        for ( let i = 0; i < n; i++ ) {
            let rawPart = rawParts[i];
            if ( rawPart.charAt(0) === '!' ) {
                if ( reStrs.length === 0 ) {
                    not = true;
                }
                rawPart = rawPart.slice(1);
            }
            let reStr = '';
            if ( rawPart.startsWith('/') && rawPart.endsWith('/') ) {
                reStr = rawPart.slice(1, -1);
                try {
                    new RegExp(reStr);
                } catch(ex) {
                    reStr = '';
                }
            }
            if ( reStr === '' ) {
                const hardBeg = rawPart.startsWith('|');
                if ( hardBeg ) {
                    rawPart = rawPart.slice(1);
                }
                const hardEnd = rawPart.endsWith('|');
                if ( hardEnd ) {
                    rawPart = rawPart.slice(0, -1);
                }
                // https://developer.mozilla.org/en/docs/Web/JavaScript/Guide/Regular_Expressions
                reStr = rawPart.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                // https://github.com/orgs/uBlockOrigin/teams/ublock-issues-volunteers/discussions/51
                //   Be more flexible when interpreting leading/trailing pipes,
                //   as leading/trailing pipes are often used in static filters.
                if ( hardBeg ) {
                    reStr = reStr !== '' ? '(?:^|\\s|\\|)' + reStr : '\\|';
                }
                if ( hardEnd ) {
                    reStr += '(?:\\||\\s|$)';
                }
            }
            if ( reStr === '' ) { continue; }
            reStrs.push(reStr);
            if ( i < (n - 1) && rawParts[i + 1] === '||' ) {
                i += 1;
                continue;
            }
            reStr = reStrs.length === 1 ? reStrs[0] : reStrs.join('|');
            userFilters.push({
                re: new RegExp(reStr, 'i'),
                r: !not
            });
            reStrs.length = 0;
            not = false;
        }
        filters = builtinFilters.concat(userFilters);
    };

    const filterOne = function(logEntry) {
        if (
            logEntry.dead ||
            selectedTabId !== 0 &&
            (
                logEntry.tabId === undefined ||
                logEntry.tabId > 0 && logEntry.tabId !== selectedTabId
            )
        ) {
            return false;
        }

        if ( masterFilterSwitch === false || filters.length === 0 ) {
            return true;
        }

        // Do not filter out tab load event, they help separate key sections
        // of logger.
        if ( logEntry.type === 'tabLoad' ) { return true; }

        for ( const f of filters ) {
            if ( f.re.test(logEntry.textContent) !== f.r ) { return false; }
        }
        return true;
    };

    const filterAll = function() {
        filteredLoggerEntries = [];
        filteredLoggerEntryVoidedCount = 0;
        for ( const entry of loggerEntries ) {
            if ( filterOne(entry) === false ) { continue; }
            filteredLoggerEntries.push(entry);
            if ( entry.voided ) {
                filteredLoggerEntryVoidedCount += 1;
            }
        }
        viewPort.updateContent(0);
        dom.cl.toggle('#filterButton', 'active', filters.length !== 0);
        dom.cl.toggle('#clean', 'disabled', filteredLoggerEntryVoidedCount === 0);
        dom.cl.toggle('#clear', 'disabled', filteredLoggerEntries.length === 0);
    };

    const onFilterChangedAsync = (( ) => {
        let timer;
        const commit = ( ) => {
            timer = undefined;
            parseInput();
            filterAll();
        };
        return ( ) => {
            if ( timer !== undefined ) {
                clearTimeout(timer);
            }
            timer = vAPI.setTimeout(commit, 750);
        };
    })();

    const onFilterButton = function() {
        masterFilterSwitch = !masterFilterSwitch;
        dom.cl.toggle('#netInspector', 'f', masterFilterSwitch);
        filterAll();            
    };

    const onToggleExtras = function(ev) {
        dom.cl.toggle(ev.target, 'expanded');
    };

    const onToggleBuiltinExpression = function(ev) {
        builtinFilters.length = 0;

        dom.cl.toggle(ev.target, 'on');
        const filtexElems = qsa$(ev.currentTarget, '[data-filtex]');
        const orExprs = [];
        let not = false;
        for ( const filtexElem of filtexElems ) {
            let filtex = dom.attr(filtexElem, 'data-filtex');
            let active = dom.cl.has(filtexElem, 'on');
            if ( filtex === '!' ) {
                if ( orExprs.length !== 0 ) {
                    builtinFilters.push({
                        re: new RegExp(orExprs.join('|')),
                        r: !not
                    });
                    orExprs.length = 0;
                }
                not = active;
            } else if ( active ) {
                orExprs.push(filtex);
            }
        }
        if ( orExprs.length !== 0 ) {
            builtinFilters.push({
                re: new RegExp(orExprs.join('|')),
                r: !not
            });
        }
        filters = builtinFilters.concat(userFilters);
        dom.cl.toggle('#filterExprButton', 'active', builtinFilters.length !== 0);
        filterAll();
    };

    dom.on('#filterButton', 'click', onFilterButton);
    dom.on('#filterInput > input', 'input', onFilterChangedAsync);
    dom.on('#filterExprButton', 'click', onToggleExtras);
    dom.on('#filterExprPicker', 'click', '[data-filtex]', onToggleBuiltinExpression);

    // https://github.com/gorhill/uBlock/issues/404
    //   Ensure page state is in sync with the state of its various widgets.
    parseInput();
    filterAll();

    return { filterOne, filterAll };
})();

/******************************************************************************/

// Discard logger entries to prevent undue memory usage growth. The criteria
// to discard are multiple and user configurable:
//
// - Max number of page load per distinct tab
// - Max number of entry per distinct tab
// - Max entry age

const rowJanitor = (( ) => {
    const tabIdToDiscard = new Set();
    const tabIdToLoadCountMap = new Map();
    const tabIdToEntryCountMap = new Map();

    let rowIndex = 0;

    const discard = function(timeRemaining) {
        const opts = loggerSettings.discard;
        const maxLoadCount = typeof opts.maxLoadCount === 'number'
            ? opts.maxLoadCount
            : 0;
        const maxEntryCount = typeof opts.maxEntryCount === 'number'
            ? opts.maxEntryCount
            : 0;
        const obsolete = typeof opts.maxAge === 'number'
            ? Date.now() - opts.maxAge * 60000
            : 0;
        const deadline = Date.now() + Math.ceil(timeRemaining);

        let i = rowIndex;
        // TODO: below should not happen -- remove when confirmed.
        if ( i >= loggerEntries.length ) {
            i = 0;
        }

        if ( i === 0 ) {
            tabIdToDiscard.clear();
            tabIdToLoadCountMap.clear();
            tabIdToEntryCountMap.clear();
        }

        let idel = -1;
        let bufferedTabId = 0;
        let bufferedEntryCount = 0;
        let modified = false;

        while ( i < loggerEntries.length ) {

            if ( i % 64 === 0 && Date.now() >= deadline ) { break; }

            const entry = loggerEntries[i];
            const tabId = entry.tabId || 0;

            if ( entry.dead || tabIdToDiscard.has(tabId) ) {
                if ( idel === -1 ) { idel = i; }
                i += 1;
                continue;
            }

            if ( maxLoadCount !== 0 && entry.type === 'tabLoad' ) {
                let count = (tabIdToLoadCountMap.get(tabId) || 0) + 1;
                tabIdToLoadCountMap.set(tabId, count);
                if ( count >= maxLoadCount ) {
                    tabIdToDiscard.add(tabId);
                }
            }

            if ( maxEntryCount !== 0 ) {
                if ( bufferedTabId !== tabId ) {
                    if ( bufferedEntryCount !== 0 ) {
                        tabIdToEntryCountMap.set(bufferedTabId, bufferedEntryCount);
                    }
                    bufferedTabId = tabId;
                    bufferedEntryCount = tabIdToEntryCountMap.get(tabId) || 0;
                }
                bufferedEntryCount += 1;
                if ( bufferedEntryCount >= maxEntryCount ) {
                    tabIdToDiscard.add(bufferedTabId);
                }
            }

            // Since entries in the logger are chronologically ordered,
            // everything below obsolete is to be discarded.
            if ( obsolete !== 0 && entry.tstamp <= obsolete ) {
                if ( idel === -1 ) { idel = i; }
                break;
            }

            if ( idel !== -1 ) {
                loggerEntries.copyWithin(idel, i);
                loggerEntries.length -= i - idel;
                idel = -1;
                modified = true;
            }

            i += 1;
        }

        if ( idel !== -1 ) {
            loggerEntries.length = idel;
            modified = true;
        }

        if ( i >= loggerEntries.length ) { i = 0; }
        rowIndex = i;

        if ( rowIndex === 0 ) {
            tabIdToDiscard.clear();
            tabIdToLoadCountMap.clear();
            tabIdToEntryCountMap.clear();
        }

        if ( modified === false ) { return; }

        rowFilterer.filterAll();
    };

    const discardAsync = function() {
        setTimeout(
            ( ) => {
                self.requestIdleCallback(deadline => {
                    discard(deadline.timeRemaining());
                    discardAsync();
                });
            },
            1889
        );
    };

    // Clear voided entries from the logger's visible content.
    //
    // Voided entries should be visible only from the "All" option of the
    // tab selector.
    //
    const clean = function() {
        if ( filteredLoggerEntries.length === 0 ) { return; }

        let j = 0;
        let targetEntry = filteredLoggerEntries[0];
        for ( const entry of loggerEntries ) {
            if ( entry !== targetEntry ) { continue; }
            if ( entry.voided ) {
                entry.dead = true;
            }
            j += 1;
            if ( j === filteredLoggerEntries.length ) { break; }
            targetEntry = filteredLoggerEntries[j];
        }
        rowFilterer.filterAll();
    };

    // Clear the logger's visible content.
    //
    // "Unrelated" entries -- shown for convenience -- will be also cleared
    // if and only if the filtered logger content is made entirely of unrelated
    // entries. In effect, this means clicking a second time on the eraser will
    // cause unrelated entries to also be cleared.
    //
    const clear = function() {
        if ( filteredLoggerEntries.length === 0 ) { return; }

        let clearUnrelated = true;
        if ( selectedTabId !== 0 ) {
            for ( const entry of filteredLoggerEntries ) {
                if ( entry.tabId === selectedTabId ) {
                    clearUnrelated = false;
                    break;
                }
            }
        }

        let j = 0;
        let targetEntry = filteredLoggerEntries[0];
        for ( const entry of loggerEntries ) {
            if ( entry !== targetEntry ) { continue; }
            if ( entry.tabId === selectedTabId || clearUnrelated ) {
                entry.dead = true;
            }
            j += 1;
            if ( j === filteredLoggerEntries.length ) { break; }
            targetEntry = filteredLoggerEntries[j];
        }
        rowFilterer.filterAll();
    };

    discardAsync();

    dom.on('#clean', 'click', clean);
    dom.on('#clear', 'click', clear);

    return {
        inserted: function(count) {
            if ( rowIndex !== 0 ) {
                rowIndex += count;
            }
        },
    };
})();

/******************************************************************************/

const pauseNetInspector = function() {
    netInspectorPaused = dom.cl.toggle('#netInspector', 'paused');
};

/******************************************************************************/

const toggleVCompactView = function() {
    dom.cl.toggle('#netInspector .vCompactToggler', 'vExpanded');
    viewPort.updateLayout();
};

/******************************************************************************/

const popupManager = (( ) => {
    let realTabId = 0;
    let popup = null;
    let popupObserver = null;

    const resizePopup = function() {
        if ( popup === null ) { return; }
        const popupBody = popup.contentWindow.document.body;
        if ( popupBody.clientWidth !== 0 && popup.clientWidth !== popupBody.clientWidth ) {
            popup.style.setProperty('width', popupBody.clientWidth + 'px');
        }
        if ( popupBody.clientHeight !== 0 && popup.clientHeight !== popupBody.clientHeight ) {
            popup.style.setProperty('height', popupBody.clientHeight + 'px');
        }
    };

    const onLoad = function() {
        resizePopup();
        popupObserver.observe(popup.contentDocument.body, {
            subtree: true,
            attributes: true
        });
    };

    const setTabId = function(tabId) {
        if ( popup === null ) { return; }
        dom.attr(popup, 'src', `popup-fenix.html?portrait=1&tabId=${tabId}`);
    };

    const onTabIdChanged = function() {
        const tabId = tabIdFromPageSelector();
        if ( tabId === 0 ) { return toggleOff(); }
        realTabId = tabId;
        setTabId(realTabId);
    };

    const toggleOn = function() {
        const tabId = tabIdFromPageSelector();
        if ( tabId === 0 ) { return; }
        realTabId = tabId;

        popup = qs$('#popupContainer');

        dom.on(popup, 'load', onLoad);
        popupObserver = new MutationObserver(resizePopup);

        const parent = qs$('#inspectors');
        const rect = parent.getBoundingClientRect();
        popup.style.setProperty('right', `${rect.right - parent.clientWidth}px`);
        dom.cl.add(parent, 'popupOn');

        dom.on(document, 'tabIdChanged', onTabIdChanged);

        setTabId(realTabId);
        dom.cl.add('#showpopup', 'active');
    };

    const toggleOff = function() {
        dom.cl.remove('#showpopup', 'active');
        dom.off(document, 'tabIdChanged', onTabIdChanged);
        dom.cl.remove('#inspectors', 'popupOn');
        dom.off(popup, 'load', onLoad);
        popupObserver.disconnect();
        popupObserver = null;
        dom.attr(popup, 'src', '');
    
        realTabId = 0;
    };

    const api = {
        get tabId() { return realTabId || 0; },
        toggleOff: function() {
            if ( realTabId !== 0 ) {
                toggleOff();
            }
        }
    };

    dom.on('#showpopup', 'click', ( ) => {
        void (realTabId === 0 ? toggleOn() : toggleOff());
    });

    return api;
})();

/******************************************************************************/

// Filter hit stats' MVP ("minimum viable product")
//
const loggerStats = (( ) => {
    const enabled = false;
    const filterHits = new Map();
    let dialog;
    let timer;
    const makeRow = function() {
        const div = document.createElement('div');
        div.appendChild(document.createElement('span'));
        div.appendChild(document.createElement('span'));
        return div;
    };

    const fillRow = function(div, entry) {
        div.children[0].textContent = entry[1].toLocaleString();
        div.children[1].textContent = entry[0];
    };

    const updateList = function() {
        const sortedHits = Array.from(filterHits).sort((a, b) => {
            return b[1] - a[1];
        });

        const doc = document;
        const parent = qs$(dialog, '.sortedEntries');
        let i = 0;

        // Reuse existing rows
        for ( let iRow = 0; iRow < parent.childElementCount; iRow++ ) {
            if ( i === sortedHits.length ) { break; }
            fillRow(parent.children[iRow], sortedHits[i]);
            i += 1;
        }

        // Append new rows
        if ( i < sortedHits.length ) {
            const list = doc.createDocumentFragment();
            for ( ; i < sortedHits.length; i++ ) {
                const div = makeRow();
                fillRow(div, sortedHits[i]);
                list.appendChild(div);
            }
            parent.appendChild(list);
        }

        // Remove extraneous rows
        // [Should never happen at this point in this current
        //  bare-bone implementation]
    };

    const toggleOn = function() {
        dialog = modalDialog.create(
            '#loggerStatsDialog',
            ( ) => {
                dialog = undefined;
                if ( timer !== undefined ) {
                    self.cancelIdleCallback(timer);
                    timer = undefined;
                }
            }
        );
        updateList();
        modalDialog.show();
    };

    dom.on('#loggerStats', 'click', toggleOn);

    return {
        processFilter: function(filter) {
            if ( enabled !== true ) { return; }
            if ( filter.source !== 'static' && filter.source !== 'cosmetic' ) {
                return;
            }
            filterHits.set(filter.raw, (filterHits.get(filter.raw) || 0) + 1);
            if ( dialog === undefined || timer !== undefined ) { return; }
            timer = self.requestIdleCallback(
                ( ) => {
                    timer = undefined;
                    updateList();
                },
                { timeout: 2001 }
            );
        }
    };
})();

/******************************************************************************/

(( ) => {
    const lines = [];
    const options = {
        format: 'list',
        encoding: 'markdown',
        time: 'anonymous',
    };
    let dialog;

    const collectLines = function() {
        lines.length = 0;
        let t0 = filteredLoggerEntries.length !== 0
            ? filteredLoggerEntries[filteredLoggerEntries.length - 1].tstamp
            : 0;
        for ( const entry of filteredLoggerEntries ) {
            const text = entry.textContent;
            const fields = [];
            let i = 0;
            let beg = text.indexOf('\t');
            if ( beg === 0 ) { continue; }
            let timeField = text.slice(0, beg);
            if ( options.time === 'anonymous' ) {
                timeField = '+' + Math.round((entry.tstamp - t0) / 1000).toString();
            }
            fields.push(timeField);
            beg += 1;
            while ( beg < text.length ) {
                let end = text.indexOf('\t', beg);
                if ( end === -1 ) { end = text.length; }
                fields.push(text.slice(beg, end));
                beg = end + 1;
                i += 1;
            }
            lines.push(fields);
        }
    };

    const formatAsPlainTextTable = function() {
        const outputAll = [];
        for ( const fields of lines ) {
            outputAll.push(fields.join('\t'));
        }
        outputAll.push('');
        return outputAll.join('\n');
    };

    const formatAsMarkdownTable = function() {
        const outputAll = [];
        let fieldCount = 0;
        for ( const fields of lines ) {
            if ( fields.length <= 2 ) { continue; }
            if ( fields.length > fieldCount ) {
                fieldCount = fields.length;
            }
            const outputOne = [];
            for ( let i = 0; i < fields.length; i++ ) {
                const field = fields[i];
                let code = /\b(?:www\.|https?:\/\/)/.test(field) ? '`' : '';
                outputOne.push(` ${code}${field.replace(/\|/g, '\\|')}${code} `);
            }
            outputAll.push(outputOne.join('|'));
        }
        if ( fieldCount !== 0 ) {
            outputAll.unshift(
                `${' |'.repeat(fieldCount-1)} `,
                `${':--- |'.repeat(fieldCount-1)}:--- `
            );
        }
        return `<details><summary>Logger output</summary>\n\n|${outputAll.join('|\n|')}|\n</details>\n`;
    };

    const formatAsTable = function() {
        if ( options.encoding === 'plain' ) {
            return formatAsPlainTextTable();
        }
        return formatAsMarkdownTable();
    };

    const formatAsList = function() {
        const outputAll = [];
        for ( const fields of lines ) {
            const outputOne = [];
            for ( let i = 0; i < fields.length; i++ ) {
                let str = fields[i];
                if ( str.length === 0 ) { continue; }
                outputOne.push(str);
            }
            outputAll.push(outputOne.join('\n'));
        }
        let before, between, after;
        if ( options.encoding === 'markdown' ) {
            const code = '```';
            before = `<details><summary>Logger output</summary>\n\n${code}\n`;
            between = `\n${code}\n${code}\n`;
            after = `\n${code}\n</details>\n`;
        } else {
            before = '';
            between = '\n\n';
            after = '\n';
        }
        return `${before}${outputAll.join(between)}${after}`;
    };

    const format = function() {
        const output = qs$(dialog, '.output');
        if ( options.format === 'list' ) {
            output.textContent = formatAsList();
        } else {
            output.textContent = formatAsTable();
        }
    };

    const setRadioButton = function(group, value) {
        if ( options.hasOwnProperty(group) === false ) { return; }
        const groupEl = qs$(dialog, `[data-radio="${group}"]`);
        const buttonEls = qsa$(groupEl, '[data-radio-item]');
        for ( const buttonEl of buttonEls ) {
            dom.cl.toggle(
                buttonEl,
                'on',
                dom.attr(buttonEl, 'data-radio-item') === value
            );
        }
        options[group] = value;
    };

    const onOption = function(ev) {
        const target = ev.target.closest('span[data-i18n]');
        if ( target === null ) { return; }

        // Copy to clipboard
        if ( target.matches('.pushbutton') ) {
            const textarea = qs$(dialog, 'textarea');
            textarea.focus();
            if ( textarea.selectionEnd === textarea.selectionStart ) {
                textarea.select();
            }
            document.execCommand('copy');
            ev.stopPropagation();
            return;
        }

        // Radio buttons
        const group = target.closest('[data-radio]');
        if ( group === null ) { return; }
        if ( target.matches('span.on') ) { return; }
        const item = target.closest('[data-radio-item]');
        if ( item === null ) { return; }
        setRadioButton(
            dom.attr(group, 'data-radio'),
            dom.attr(item, 'data-radio-item')
        );
        format();
        ev.stopPropagation();
    };

    const toggleOn = function() {
        dialog = modalDialog.create(
            '#loggerExportDialog',
            ( ) => {
                dialog = undefined;
                lines.length = 0;
            }
        );

        setRadioButton('format', options.format);
        setRadioButton('encoding', options.encoding);

        collectLines();
        format();

        dom.on(qs$(dialog, '.options'), 'click', onOption, { capture: true });

        modalDialog.show();
    };

    dom.on('#loggerExport', 'click', toggleOn);
})();

/******************************************************************************/

// TODO:
// - Give some thoughts to:
//   - an option to discard immediately filtered out new entries
//   - max entry count _per load_
//
const loggerSettings = (( ) => {
    const settings = {
        discard: {
            maxAge: 240,            // global
            maxEntryCount: 2000,    // per-tab
            maxLoadCount: 20,       // per-tab
        },
        columns: [ true, true, true, true, true, true, true, true ],
        linesPerEntry: 4,
    };

    vAPI.localStorage.getItemAsync('loggerSettings').then(value => {
        try {
            const stored = JSON.parse(value);
            if ( typeof stored.discard.maxAge === 'number' ) {
                settings.discard.maxAge = stored.discard.maxAge;
            }
            if ( typeof stored.discard.maxEntryCount === 'number' ) {
                settings.discard.maxEntryCount = stored.discard.maxEntryCount;
            }
            if ( typeof stored.discard.maxLoadCount === 'number' ) {
                settings.discard.maxLoadCount = stored.discard.maxLoadCount;
            }
            if ( typeof stored.linesPerEntry === 'number' ) {
                settings.linesPerEntry = stored.linesPerEntry;
            }
            if ( Array.isArray(stored.columns) ) {
                settings.columns = stored.columns;
            }
        } catch(ex) {
        }
    });

    const valueFromInput = function(input, def) {
        let value = parseInt(input.value, 10);
        if ( isNaN(value) ) { value = def; }
        const min = parseInt(dom.attr(input, 'min'), 10);
        if ( isNaN(min) === false ) {
            value = Math.max(value, min);
        }
        const max = parseInt(dom.attr(input, 'max'), 10);
        if ( isNaN(max) === false ) {
            value = Math.min(value, max);
        }
        return value;
    };

    const toggleOn = function() {
        const dialog = modalDialog.create(
            '#loggerSettingsDialog',
            dialog => {
                toggleOff(dialog);
            }
        );

        // Number inputs
        let inputs = qsa$(dialog, 'input[type="number"]');
        inputs[0].value = settings.discard.maxAge;
        inputs[1].value = settings.discard.maxLoadCount;
        inputs[2].value = settings.discard.maxEntryCount;
        inputs[3].value = settings.linesPerEntry;
        dom.on(inputs[3], 'input', ev => {
            settings.linesPerEntry = valueFromInput(ev.target, 4);
            viewPort.updateLayout();
        });

        // Column checkboxs
        const onColumnChanged = ev => {
            const input = ev.target;
            const i = parseInt(dom.attr(input, 'data-column'), 10);
            settings.columns[i] = input.checked !== true;
            viewPort.updateLayout();
        };
        inputs = qsa$(dialog, 'input[type="checkbox"][data-column]');
        for ( const input of inputs ) {
            const i = parseInt(dom.attr(input, 'data-column'), 10);
            input.checked = settings.columns[i] === false;
            dom.on(input, 'change', onColumnChanged);
        }

        modalDialog.show();
    };

    const toggleOff = function(dialog) {
        // Number inputs
        let inputs = qsa$(dialog, 'input[type="number"]');
        settings.discard.maxAge = valueFromInput(inputs[0], 240);
        settings.discard.maxLoadCount = valueFromInput(inputs[1], 25);
        settings.discard.maxEntryCount = valueFromInput(inputs[2], 2000);
        settings.linesPerEntry = valueFromInput(inputs[3], 4);

        // Column checkboxs
        inputs = qsa$(dialog, 'input[type="checkbox"][data-column]');
        for ( const input of inputs ) {
            const i = parseInt(dom.attr(input, 'data-column'), 10);
            settings.columns[i] = input.checked !== true;
        }

        vAPI.localStorage.setItem(
            'loggerSettings',
            JSON.stringify(settings)
        );

        viewPort.updateLayout();
    };

    dom.on('#loggerSettings', 'click', toggleOn);

    return settings;
})();

/******************************************************************************/

logger.resize = (function() {
    let timer;

    const resize = function() {
        const vrect = dom.body.getBoundingClientRect();
        for ( const elem of qsa$('.vscrollable') ) {
            const crect = elem.getBoundingClientRect();
            const dh = crect.bottom - vrect.bottom;
            if ( dh === 0 ) { continue; }
            elem.style.height = Math.ceil(crect.height - dh) + 'px';
        }
    };

    const resizeAsync = function() {
        if ( timer !== undefined ) { return; }
        timer = self.requestAnimationFrame(( ) => {
            timer = undefined;
            resize();
        });
    };

    resizeAsync();

    dom.on(window, 'resize', resizeAsync, { passive: true });

    return resizeAsync;
})();

/******************************************************************************/

const grabView = function() {
    if ( logger.ownerId === undefined ) {
        logger.ownerId = Date.now();
    }
    readLogBuffer();
};

const releaseView = function() {
    if ( logger.ownerId === undefined ) { return; }
    vAPI.messaging.send('loggerUI', {
        what: 'releaseView',
        ownerId: logger.ownerId,
    });
    logger.ownerId = undefined;
};

dom.on(window, 'pagehide', releaseView);
dom.on(window, 'pageshow', grabView);
// https://bugzilla.mozilla.org/show_bug.cgi?id=1398625
dom.on(window, 'beforeunload', releaseView);

/******************************************************************************/

dom.on('#pageSelector', 'change', pageSelectorChanged);
dom.on('#refresh', 'click', reloadTab);
dom.on('#netInspector .vCompactToggler', 'click', toggleVCompactView);
dom.on('#pause', 'click', pauseNetInspector);

// https://github.com/gorhill/uBlock/issues/507
//   Ensure tab selector is in sync with URL hash
pageSelectorFromURLHash();
dom.on(window, 'hashchange', pageSelectorFromURLHash);

// Start to watch the current window geometry 2 seconds after the document
// is loaded, to be sure no spurious geometry changes will be triggered due
// to the window geometry pontentially not settling fast enough.
if ( self.location.search.includes('popup=1') ) {
    dom.on(window, 'load', ( ) => {
        setTimeout(
            ( ) => {
                popupLoggerBox = {
                    x: self.screenX,
                    y: self.screenY,
                    w: self.outerWidth,
                    h: self.outerHeight,
                };
        }, 2000);
    }, { once: true });
}

/******************************************************************************/
