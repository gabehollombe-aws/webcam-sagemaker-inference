import React, { Component } from 'react';
import { Card, CardGroup, Form, Image, Input } from 'semantic-ui-react'
import Webcam from 'react-webcam';

import Amplify, { API } from 'aws-amplify';
import aws_exports from './aws-exports';
Amplify.configure(aws_exports);

// argMax via https://gist.github.com/engelen/fbce4476c9e68c52ff7e5c2da5c24a28
function argMax(array) {
  return array.map((x, i) => [x, i]).reduce((r, a) => (a[0] > r[0] ? a : r))[1];
}

class WebcamCapture extends React.Component {
  constructor(props) {
    super(props);
  }
  setRef = webcam => {
    this.webcam = webcam;
  };

  handleCapture=() => {
    this.props.onCapture(this.webcam.getScreenshot())
  }

  render() {
    const videoConstraints = {
      width: 244,
      height: 244,
      facingMode: "user"
    };

    return (
      <div>
        <div>
          <Webcam
            audio={false}
            height={244}
            width={244}
            ref={this.setRef}
            screenshotFormat="image/jpeg"
            screenshotWidth={224} // no sense capturing images in a resolution higher than what resnet wants
            videoConstraints={videoConstraints}
          />
        </div>

        <Form.Button onClick={this.handleCapture}>Classify</Form.Button>
      </div>
    );
  }
}

class ClassifiedImage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      classLabel: null,
      probability: null,
    }
  }

  async componentDidMount() {
    const [classLabel, probability] = await this.props.classifier(this.props.imageSrc);
    this.setState({ classLabel, probability })
  }

  render() {
    return (
      <Card>
        <Image src={this.props.imageSrc} />
        <Card.Content>
          <Card.Header>
            { this.state.classLabel ? this.state.classLabel : "Loading..." }
          </Card.Header>
          <Card.Meta>
            { this.state.probability ? this.state.probability : "" }
          </Card.Meta>
        </Card.Content>
      </Card>
    )
  }
}

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      imageSrcs: [],
      endpointName: '',
      endpointRegion: '',
      classLabels: '',
    }
  }

  classifier = async (imageSrc) => {
    const base64Image = new Buffer(imageSrc.replace(/^data:image\/\w+;base64,/, ""), 'base64')
    const { predictions } = await API.post(
      'api6342d95d',
      '/classify', 
      {
        body: {
          base64Image,
          endpointName: this.state.endpointName,
          endpointRegion: this.state.endpointRegion,
        },
      }
    );
    const highestProbabilityIndex = argMax(predictions);
    const classLabels = [].concat(this.state.classLabels.split(' '));
    classLabels.sort();
    return [classLabels[highestProbabilityIndex], predictions[highestProbabilityIndex]];
  }

  classify = async (imageSrc) => {
    this.setState({
      imageSrcs: [...this.state.imageSrcs, imageSrc]
    })
  };

  handleChange = (e) => this.setState({ [e.target.name]: e.target.value })

  render() {
    return (
      <div>
      <Form>
        <Form.Group widths='equal'>
          <Form.Input label='Sagemaker Endpoint Name' placeholder='Sagemaker Endpoint Name' name='endpointName' onChange={this.handleChange} />
          <Form.Input label='Sagemaker Endpoint Region' placeholder='Sagemaker Endpoint Region' name='endpointRegion' onChange={this.handleChange} />
          <Form.Input label='Class Labels' placeholder='space delimited list of labels' name='classLabels' onChange={this.handleChange} />
        </Form.Group>

        <Form.Group widths='equal'>
          <WebcamCapture onCapture={this.classify}/>
        </Form.Group>
      </Form>

      <CardGroup>
        { this.state.imageSrcs.map((src, index) => <ClassifiedImage key={"img"+index} imageSrc={src} classifier={this.classifier} />) }
      </CardGroup>
      </div>
    );
  }
}

export default App;
