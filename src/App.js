import React, { Component } from 'react';
import { Accordion, Button, Card, CardGroup, Form, Image } from 'semantic-ui-react'
import Webcam from 'react-webcam';
import classNames from 'classnames'
import Dropzone from 'react-dropzone'

import Amplify, { API } from 'aws-amplify';
import aws_exports from './aws-exports';
Amplify.configure(aws_exports);

const IMAGE_WIDTH = 224;
const IMAGE_HEIGHT = 224;

const styles = {
  dropZone: {
    width: '100%',
    height: '200px',
    border: '1px solid gray',
    margin: '10px 0',
  }
}

// argMax via https://gist.github.com/engelen/fbce4476c9e68c52ff7e5c2da5c24a28
function argMax(array) {
  return array.map((x, i) => [x, i]).reduce((r, a) => (a[0] > r[0] ? a : r))[1];
}

function zipArrays(a, b) {
  return a.map((e, i) => [e, b[i]])
}

// scaleImage via https://gist.github.com/MikeRogers0/6264546
function scaleImage(url, width, height, callback){
	let img = new window.Image();

	img.onload = function(){
		var canvas = document.createElement("canvas"),
        ctx = canvas.getContext("2d");

        canvas.width = width;
        canvas.height = height;

        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // resize code via https://sdqali.in/blog/2013/10/03/fitting-an-image-in-to-a-canvas-object/
        var imageAspectRatio = img.width / img.height;
        var canvasAspectRatio = canvas.width / canvas.height;
        var renderableHeight, renderableWidth, xStart, yStart;
        if(imageAspectRatio < canvasAspectRatio) {
          renderableHeight = canvas.height;
          renderableWidth = img.width * (renderableHeight / img.height);
          xStart = (canvas.width - renderableWidth) / 2;
          yStart = 0;
        }
        else if(imageAspectRatio > canvasAspectRatio) {
          renderableWidth = canvas.width
          renderableHeight = img.height * (renderableWidth / img.width);
          xStart = 0;
          yStart = (canvas.height - renderableHeight) / 2;
        }
        else {
          renderableHeight = canvas.height;
          renderableWidth = canvas.width;
          xStart = 0;
          yStart = 0;
        }
        ctx.drawImage(img, xStart, yStart, renderableWidth, renderableHeight);

        callback(canvas);
	};

  img.src = url;
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
      width: IMAGE_WIDTH,
      height: IMAGE_HEIGHT,
      facingMode: "user"
    };

    return (
      <div>
        <div>
          <Webcam
            audio={false}
            height={IMAGE_HEIGHT}
            width={IMAGE_WIDTH}
            ref={this.setRef}
            screenshotFormat="image/jpeg"
            screenshotWidth={IMAGE_WIDTH} // no sense capturing images in a resolution higher than what resnet wants
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
    const { classLabels, predictions, highestProbabilityIndex } = await this.props.classifier(this.props.imageSrc);
    let sortedClassLabels = classLabels.splice(0)
    sortedClassLabels.sort()
    this.setState({ 
      bestLabel: sortedClassLabels[highestProbabilityIndex],
      bestLabelScore: predictions[highestProbabilityIndex],
      allLabelsScores: zipArrays(sortedClassLabels, predictions),
    })
  }

  accordionPanels = () => {
    if (!this.state.allLabelsScores) return [];

    const labelsAndScores = this.state.allLabelsScores.map(([label, score]) => 
      <p>{label}: {score}</p>
    )
    return [{
      key: 'labels-and-scores',
      title: 'Show Score Details',
      content: labelsAndScores
    }]
  }

  render() {
    return (
      <Card style={{width: '224px'}}>
        <Image src={this.props.imageSrc} />
        <Card.Content>
          <Card.Header>
            { this.state.bestLabel ? this.state.bestLabel : "Loading..." }
          </Card.Header>
          <Card.Meta>
            { this.state.bestLabelScore ? this.state.bestLabelScore : "" }
          </Card.Meta>
          <Card.Description>
            <Accordion defaultActiveIndex={-1} panels={this.accordionPanels()} />
          </Card.Description>
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
      endpointRegion: 'us-west-2',
      classLabels: '',
    }
  }

  classifier = async (imageSrc) => {
    const base64Image = new Buffer(imageSrc.replace(/^data:image\/\w+;base64,/, ""), 'base64')
    const { predictions } = await API.post(
      aws_exports.aws_cloud_logic_custom[0].name,
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
    return {
      classLabels, predictions, highestProbabilityIndex
    }
  }

  classify = async (imageSrc) => {
    this.setState({
      imageSrcs: [...this.state.imageSrcs, imageSrc]
    })
  };

  handleChange = (e) => this.setState({ [e.target.name]: e.target.value })

  classifyScaled = (canvas) => {
    this.classify(canvas.toDataURL())
  }

  onDrop = (acceptedFiles, rejectedFiles) => {
    // Do something with files
    acceptedFiles.forEach(f => {
      var reader  = new FileReader();
      reader.addEventListener("load", () => {
        scaleImage(reader.result, IMAGE_WIDTH, IMAGE_HEIGHT, this.classifyScaled)
      }, false);
      reader.readAsDataURL(f);
    })
  }

  handleClearImages = () => {
    this.setState({
      imageSrcs: []
    })
  }

  render() {
    return (
      <div>
      <Form>
        <Form.Group widths='equal'>
          <Form.Input label='Sagemaker Endpoint Name' placeholder='Sagemaker Endpoint Name' name='endpointName' onChange={this.handleChange} value={this.state.endpointName} />
          <Form.Input label='Sagemaker Endpoint Region' placeholder='Sagemaker Endpoint Region' name='endpointRegion' onChange={this.handleChange} value={this.state.endpointRegion} />
          <Form.Input label='Class Labels' placeholder='space delimited list of labels' name='classLabels' onChange={this.handleChange} value={this.state.classLabels} />
        </Form.Group>

        <Form.Group widths='equal'>
          <WebcamCapture onCapture={this.classify}/>
        </Form.Group>
      </Form>

      <Dropzone onDrop={this.onDrop} accept={['image/jpg', 'image/jpeg', 'image/png']}>
        {({getRootProps, getInputProps, isDragActive}) => {
          return (
            <div 
              {...getRootProps()}
              style={styles.dropZone}
              className={classNames('dropzone', {'dropzone--isActive': isDragActive})}
            >
              <input {...getInputProps()} />
              {
                isDragActive ?
                  <p>Drop files here...</p> :
                  <p>You can drag and drop images here or click to select images to upload.</p>
              }
            </div>
          )
        }}
      </Dropzone>

      <Button onClick={this.handleClearImages}>Clear Images</Button>

      <CardGroup>
        { this.state.imageSrcs.map((src, index) => <ClassifiedImage key={"img"+index} imageSrc={src} classifier={this.classifier} />) }
      </CardGroup>
      </div>
    );
  }
}

export default App;
