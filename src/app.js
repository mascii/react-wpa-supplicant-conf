import React, { Component } from 'react';
import { pbkdf2Sync } from 'pbkdf2';

const configHeader = `country=JP
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1
`;

class App extends Component {
  static makeBlob(content) {
    return new Blob([content], { type: 'text/plain' });
  }
  constructor() {
    super();

    let urlSSH = '#';
    if (!window.navigator.msSaveBlob) {
      urlSSH = window.URL.createObjectURL(this.constructor.makeBlob(''));
    }
    this.state = {
      items: [],
      count: 0,
      urlWPA: '#',
      urlSSH,
      config: '',
    };
  }

  componentWillMount() {
    this.makeConfigFile(this.state.items);
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
      passphrase: newPassphrase,
      psk: newPassphrase.length !== 0 ? pbkdf2Sync(newPassphrase, newSSID, 4096, 32, 'sha1').toString('hex') : '',
    });
    this.makeConfigFile(items);
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
    this.makeConfigFile(items);
  }

  makeConfigFile(items) {
    const config = configHeader + items.map((item) => {
      let network = 'network={\n';
      network += `    ssid="${item.id}"\n`;
      if (item.psk !== '') {
        network += `    psk=${item.psk}\n`;
      } else {
        network += '    key_mgmt=NONE\n';
      }
      network += '}';
      return network;
    }).join('\n');
    this.setState({ config });
    if (!window.navigator.msSaveBlob) {
      const urlWPA = window.URL.createObjectURL(this.constructor.makeBlob(config));
      this.setState({ urlWPA });
    }
  }

  downloadWPA() {
    if (window.navigator.msSaveBlob) {
      const fileName = 'wpa_supplicant.conf';
      window.navigator.msSaveBlob(this.constructor.makeBlob(this.state.config), fileName);
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
        SSID: {item.id},{' '}
        Passphrase: {item.passphrase}{' '}
        <button onClick={() => this.deleteItem(item)}>削除</button>
      </li>
    ));
    return (
      <div>
        <form onSubmit={e => this.addItem(e)} autocomplete="off">
          SSID: <input type="text" name="newSSID" ref={(input) => { this.inputSSID = input; }} />{' '}
          Passphrase: <input type="text" name="newPassphrase" />{' '}
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
        </a>{' '}
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

