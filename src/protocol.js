const JSZip = require('jszip');

/**
 * @typedef {Object} TWPacket
 * @prop {string} [m] Packet type
 * @prop {[session: string, {}]} [p] Packet data
 */

const cleanerRgx = /~h~/g;
const splitterRgx = /~m~[0-9]{1,}~m~/g;

module.exports = {
  /**
   * Parse websocket packet
   * @function parseWSPacket
   * @param {string} str Websocket raw data
   * @returns {TWPacket[]} TradingView packets
   */
  parseWSPacket(str) {
    const packets = str.replace(cleanerRgx, '').split(splitterRgx)
      .map((p) => {
        if (!p) return false;
        try {
          const parsed = JSON.parse(p);
          
          // Debug: Detect indicator data messages
          if (parsed.m === 'du' && parsed.p && parsed.p[1]) {
            const keys = Object.keys(parsed.p[1]);
            const studyKeys = keys.filter(k => k.startsWith('st_'));
            if (studyKeys.length > 0) {
              console.log('[Protocol] *** INDICATOR DATA DETECTED ***');
              console.log('[Protocol]   Study IDs:', studyKeys);
              console.log('[Protocol]   Packet type:', parsed.m);
              console.log('[Protocol]   Session:', parsed.p[0]);
            }
          }
          
          return parsed;
        } catch (error) {
          console.warn('Cant parse', p);
          return false;
        }
      })
      .filter((p) => p);
    
    if (global.TW_DEBUG && packets.length > 0) {
      console.log(`[Protocol] Parsed ${packets.length} packet(s) from ${str.length} bytes`);
    }
    
    return packets;
  },

  /**
   * Format websocket packet
   * @function formatWSPacket
   * @param {TWPacket} packet TradingView packet
   * @returns {string} Websocket raw data
   */
  formatWSPacket(packet) {
    const msg = typeof packet === 'object'
      ? JSON.stringify(packet)
      : packet;
    return `~m~${msg.length}~m~${msg}`;
  },

  /**
   * Parse compressed data
   * @function parseCompressed
   * @param {string} data Compressed data
   * @returns {Promise<{}>} Parsed data
   */
  async parseCompressed(data) {
    const zip = new JSZip();
    return JSON.parse(
      await (
        await zip.loadAsync(data, { base64: true })
      ).file('').async('text'),
    );
  },
};
