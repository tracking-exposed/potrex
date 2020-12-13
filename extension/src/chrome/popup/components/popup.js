import moment from 'moment'
import React from 'react'

import { Card } from '@material-ui/core'
import { Alert, AlertTitle } from '@material-ui/lab'
import FormHelperText from '@material-ui/core/FormHelperText'
import CardContent from '@material-ui/core/CardContent'
import CardActions from '@material-ui/core/CardActions'
import Button from '@material-ui/core/Button'
import Divider from '@material-ui/core/Divider'

import InfoBox from './infoBox'
import Settings from './settings'
import GetCSV from './getCSV'

import config from '../../../config'

// bo is the browser object, in chrome is named 'chrome', in firefox is 'browser'
const bo = chrome || browser

const styles = {
  width: '470px'
  // 'background-color': 'black',
}

class Popup extends React.Component {
  constructor (props) {
    super(props)
    this.state = { status: 'fetching' }
    try {
      bo.runtime.sendMessage({ type: 'localLookup' }, (userSettings) => {
        console.log('here got', userSettings)
        if (userSettings && userSettings.publicKey) { this.setState({ status: 'done', data: userSettings }) } else {
          console.log('This seems uninitialized')
          this.setState({ status: 'done', data: {} })
        }
      })
    } catch (e) {
      console.log('catch error', e.message, runtime.lastError)
      this.state = { status: 'error', data: '' }
    }
  }

  render () {
    const version = config.VERSION
    const timeago = moment.duration(moment() - moment(config.BUILDISODATE)).humanize() + ' ago'

    if (!this.state) { return (<div style={styles}>Loading...</div>) }

    console.log('popup props status', this.props, this.state)

    if (this.state.status !== 'done') {
      console.log('Incomplete info before render')
      return (
          <div style={styles}>
            <Card>
                <Alert severity="error">
                    <AlertTitle>Error</AlertTitle>
                    Extension isn't ready yet — <strong>access to <a href="https://www.pornhub.com" target="_blank">pornhub.com</a>, and this would initialize the extension. You might always switch on and off the collection from this popup.</strong>
                </Alert>
                <InfoBox />
            </Card>
            <small>version {version}, released {timeago}</small>
          </div>
      )
    }
    const about = config.WEB_ROOT + '/about'
    const privacy = config.WEB_ROOT + '/privacy'
    const experiments = config.WEB_ROOT + '/potest/next'

    return (
        <div style={styles}>
          <Card>
            <CardContent>
              <InfoBox />
              <Divider variant="middle" />
              <Settings active={this.state.data.active} />
              <FormHelperText>Data</FormHelperText>
              <GetCSV publicKey={this.state.data.publicKey } />
              <FormHelperText>About us</FormHelperText>
              <CardActions>
                <Button color="primary" href={about} target="_blank">
                  Project
                </Button>
                <Button color="primary" href={privacy} target="_blank">
                  Privacy
                </Button>
                <Button color="primary" href="https://tracking.exposed/manifesto" target="_blank">
                  Manifesto
                </Button>
                <Button color="primary" href="https://github.com/tracking-exposed/potrex/" target="_blank">
                  Software
                </Button>
                <Button color="primary" href={experiments} target="_blank">
                  Experiments
                </Button>
              </CardActions>
              <FormHelperText>version {version}, released {timeago}</FormHelperText>
            </CardContent>
          </Card>
        </div>
    )
  }
}

export default Popup
