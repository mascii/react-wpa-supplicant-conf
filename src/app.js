import React, { Component } from 'react';
import { pbkdf2Sync } from 'pbkdf2';

class App extends Component {
  static makeBlob(content) {
    return new Blob([content], { type: 'text/plain' });
  }

  static makeConfig(items) {
    let config = 'country=JP\n';
    config += 'ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev\n';
    config += 'update_config=1\n';

    config += items.map((item) => {
      let network = 'network={\n';
      network += `    ssid="${item.id}"\n`;
      if (item.psk.length > 0) {
        network += `    psk=${item.psk}\n`;
      } else {
        network += '    key_mgmt=NONE\n';
      }
      network += '}';
      return network;
    }).join('\n');

    return config;
  }

  constructor() {
    super();
    this.state = {
      items: [],
      count: 0,
      urlWPA: '#',
      urlSSH: '#',
    };
  }

  componentWillMount() {
    this.updateUrlWPA(this.state.items);
    if (!window.navigator.msSaveBlob) {
      const urlSSH = window.URL.createObjectURL(this.constructor.makeBlob(''));
      this.setState({ urlSSH });
    }
  }

  componentDidMount() {
    this.inputSSID.focus();
  }

  addItem(e) {
    e.preventDefault();
    const newSSID = e.target.newSSID.value;
    const newPassphrase = e.target.newPassphrase.value;

    if (newSSID.length === 0) return;

    const count = this.state.count + 1;
    const items = this.state.items.concat({
      key: count,
      id: newSSID,
      psk: newPassphrase.length !== 0 ? pbkdf2Sync(newPassphrase, newSSID, 4096, 32, 'sha1').toString('hex') : '',
    });
    this.updateUrlWPA(items);
    this.setState({ items, count });

    e.target.newSSID.value = '';
    e.target.newPassphrase.value = '';
    e.target.newSSID.focus();
  }

  deleteItem(item) {
    const items = this.state.items;
    const index = items.indexOf(item);
    items.splice(index, 1);
    this.setState({ items });
    this.updateUrlWPA(items);
  }

  updateUrlWPA(items) {
    if (!window.navigator.msSaveBlob) {
      const content = this.constructor.makeConfig(items);
      const urlWPA = window.URL.createObjectURL(this.constructor.makeBlob(content));
      this.setState({ urlWPA });
    }
  }

  downloadWPA() {
    if (window.navigator.msSaveBlob) {
      const fileName = 'wpa_supplicant.conf';
      const content = this.constructor.makeConfig(this.state.items);
      window.navigator.msSaveBlob(this.constructor.makeBlob(content), fileName);
    }
  }

  downloadSSH() {
    if (window.navigator.msSaveBlob) {
      const fileName = 'ssh.txt';
      window.navigator.msSaveBlob(this.constructor.makeBlob(''), fileName);
    }
  }

  render() {
    const items = this.state.items.map(item => (
      <li key={item.key}>
        SSID: {item.id},
        Security: <span className={(item.psk.length === 0) ? 'sec-weak' : ''}>{(item.psk.length > 0) ? 'WPA2' : 'None'}</span>
        <button onClick={() => this.deleteItem(item)} className="button-small button-red">削除</button>
      </li>
    ));
    return (
      <div>
        <form onSubmit={e => this.addItem(e)} autoComplete="off">
          SSID: <input type="text" name="newSSID" ref={(input) => { this.inputSSID = input; }} />
          Passphrase: <input type="password" name="newPassphrase" />
          <button type="submit">追加</button>
        </form>
        <ul>
          {items}
        </ul>
        <a
          href={this.state.urlWPA}
          onClick={() => this.downloadWPA()}
          download="wpa_supplicant.conf"
        >
          <button>wpa_supplicant.conf作成</button>
        </a>
        <a
          href={this.state.urlSSH}
          onClick={() => this.downloadSSH()}
          download="ssh.txt"
        >
          <button>ssh.txt作成</button>
        </a>
      </div>
    );
  }
}

export default App;

