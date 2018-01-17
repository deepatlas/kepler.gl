/** @jsx createElement */
import createElement from 'react-stylematic';

import {Component} from 'react';
import PropTypes from 'prop-types';
import {css} from 'styled-components';
import {findDOMNode} from 'react-dom'

import ModalDialog from './common/modal';

import Sidebar from './side-panel/side-bar';
import SideNav from './side-panel/side-nav';
import LayerManager from './side-panel/layer-manager';
import FilterManager from './side-panel/filter-manager';
import InteractionManager from './side-panel/interaction-manager';
import MapManager from './side-panel/map-manager';

// modal
import {DeleteDatasetModal} from './side-panel/modals/delete-data-modal';
import IconInfoModal from './side-panel/modals/icon-info-modal';
import DataTableModal from './side-panel/modals/data-table-modal';
import LoadDataModal from './side-panel/modals/load-data-modal';
// import LayerConfigModal from '../../../components/modal/layer-config-modal';

import {DIMENSIONS, PANELS, DATA_TABLE_ID, LAYER_CONFIG_ID, DELETE_DATA_ID, ADD_DATA_ID} from '../constants/default-settings';
import {sidePanel} from 'styles/side-panel';

const propTypes = {
  editingDataset: PropTypes.string,
  containerW: PropTypes.number.isRequired,
  filters: PropTypes.array.isRequired,
  height: PropTypes.number.isRequired,
  interactionConfig: PropTypes.object.isRequired,
  layerBlending: PropTypes.string.isRequired,
  layers: PropTypes.array.isRequired,
  mapStyle: PropTypes.object.isRequired,
  width: PropTypes.number.isRequired,
  datasets: PropTypes.object.isRequired,
  visStateActions: PropTypes.object.isRequired,
  mapStyleActions: PropTypes.object.isRequired
};

const DataTableModalStyle = css`
  height: 85%;
  width: 90%;
  top: 80px;
  padding: 32px 0px 0px 0px;
`;

/**
 *
 * Vertical sidebar containing input components for the rendering layers
 */
export default class SidePanel extends Component {

  /* component private functions */
  _onOpenOrClose = () => {
    this.props.uiStateActions.toggleSidePanel(
      this.props.uiState.activeSidePanel ? null : 'layer'
    );
  };

  _closeModal = () => {
    this.props.uiStateActions.toggleModal(null);
  };

  // this will open data table modal
  _showDatasetTable = (dataId) => {
    this.props.visStateActions.showDatasetTable(dataId);
    this.props.uiStateActions.toggleModal(DATA_TABLE_ID);
  };

  _showAddDataModal = () => {
    this.props.uiStateActions.toggleModal(ADD_DATA_ID);
  };

  // this will show the modal dialog to confirm deletion
  _removeDataset = (key) => {
    // show modal
    this.props.uiStateActions.openDeleteModal(key);
  };

  _onFileUpload = (blob) => {
    this.props.visStateActions.loadFiles(blob);
    // this._closeModal();
  };

  // this will delete the dataset
  _deleteDataset = (key) => {
    this.props.visStateActions.removeDataset(key);
    this._closeModal();
  };

  /* render functions */
  _renderModalContent(type) {
    let template = null;
    let modalProps = {};

    switch (type) {
    case 'iconInfo':
      template = <IconInfoModal/>;
      break;
    // case LAYER_CONFIG_ID:
    //   template = <LayerConfigModal close={this._closeModal}/>;
    //   break;
    case DATA_TABLE_ID:
      template = (<DataTableModal
        width={this.props.containerW * 0.9}
        height={(this.props.containerH + DIMENSIONS.topOffset) * 0.85}
        datasets={this.props.datasets}
        dataId={this.props.editingDataset}
        showDatasetTable={this.props.visStateActions.showDatasetTable}/>);
      modalProps.cssStyle = DataTableModalStyle;
      break;
    case DELETE_DATA_ID:
      const {datasetKeyToRemove} = this.props.uiState;
      const {datasets, layers} = this.props;
      // validate options
      if (datasetKeyToRemove && datasets && datasets[datasetKeyToRemove]) {
        template = (<DeleteDatasetModal
          dataset={datasets[datasetKeyToRemove]}
          layers={layers}
          deleteAction={() => this._deleteDataset(datasetKeyToRemove)}
          cancelAction={this._closeModal}/>);
      }
      break; // in case we add a new case after this one
      case ADD_DATA_ID:
      template = (<LoadDataModal
        onClose={this._closeModal}
        onFileUpload={this._onFileUpload}/>);
      modalProps = {
        title: 'Add Data To Map', footer: true, onConfirm: this._closeModal
      };
      break;
    default:
      break;
    }

    return (
      this.props.rootNode ? <ModalDialog
        {...modalProps}
        parentSelector={() => findDOMNode(this.props.rootNode)}
        isOpen={Boolean(type)}
        close={this._closeModal}>
        {template}
      </ModalDialog> : null
    );
  }

  render() {
    const {datasets, filters, layers, layerBlending, uiState, layerOrder, interactionConfig,
      visStateActions, mapStyleActions, uiStateActions} = this.props;
    const {isNavCollapsed, activeSidePanel, currentModal} = uiState;
    const isOpen = Boolean(activeSidePanel);
    const panelWidth = this.props.width - DIMENSIONS.sideBarPadding * 2;

    const layerManagerActions = {
      addLayer: visStateActions.addLayer,
      layerConfigChange: visStateActions.layerConfigChange,
      layerVisualChannelConfigChange: visStateActions.layerVisualChannelConfigChange,
      layerTypeChange: visStateActions.layerTypeChange,
      layerVisConfigChange: visStateActions.layerVisConfigChange,
      updateLayerBlending: visStateActions.updateLayerBlending,
      updateLayerOrder: visStateActions.reorderLayer,
      showDatasetTable: this._showDatasetTable,
      showAddDataModal: this._showAddDataModal,
      removeLayer: visStateActions.removeLayer,
      removeDataset: this._removeDataset
    };

    const filterManagerActions = {
      addFilter: visStateActions.addFilter,
      removeFilter: visStateActions.removeFilter,
      setFilter: visStateActions.setFilter,
      showDatasetTable: this._showDatasetTable,
      showAddDataModal: this._showAddDataModal,
      toggleAnimation: visStateActions.toggleAnimation,
      enlargeFilter: visStateActions.enlargeFilter
    };

    const interactionManagerActions = {
      onConfigChange: visStateActions.interactionConfigChange
    };

    const mapManagerActions = {
      onConfigChange: mapStyleActions.mapConfigChange,
      onStyleChange: mapStyleActions.mapStyleChange,
      onBuildingChange: mapStyleActions.mapBuildingChange
    };

    // props for enlarged filters
    const enlargedFilterIdx = filters.findIndex(f => f.enlarged);

    return (
      <div className="side-panel--container" style={sidePanel}>
        <SideNav
          activeSidePanel={activeSidePanel}
          togglePanel={uiStateActions.toggleSidePanel}
          isCollapsed={isNavCollapsed || enlargedFilterIdx > -1}/>
        <Sidebar
          width={this.props.width + DIMENSIONS.sideNavC}
          height={this.props.height}
          isOpen={isOpen}
          title={activeSidePanel && PANELS.find(({id}) => id === activeSidePanel).label}
          minifiedWidth={DIMENSIONS.sideNavC}
          onOpenOrClose={this._onOpenOrClose} >
          <div className="side-panel">
            {activeSidePanel === 'layer' &&
              <LayerManager
                {...layerManagerActions}
                datasets={datasets}
                layers={layers}
                layerOrder={layerOrder}
                layerBlending={layerBlending}
                panelWidth={panelWidth}
                openModal={uiStateActions.toggleModal}/>}
            {activeSidePanel === 'filter' &&
              <FilterManager
                {...filterManagerActions}
                datasets={datasets}
                filters={filters}
                panelWidth={panelWidth}
                openModal={uiStateActions.toggleModal}
              />}
            {activeSidePanel === 'interaction' &&
              <InteractionManager
                {...interactionManagerActions}
                datasets={datasets}
                interactionConfig={interactionConfig}
              />
            }
            {activeSidePanel === 'map' && <MapManager
              {...mapManagerActions}
              mapStyle={this.props.mapStyle}
            />}
          </div>
        </Sidebar>
        {this._renderModalContent(currentModal)}
      </div>
    );
  }
}

SidePanel.propTypes = propTypes;