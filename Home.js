import React from "react";
import {
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Modal,

} from "react-native";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import {
  Button,
  View,
  Container,
  Text,
  Content,
  Toast,
  Header,
  Body,
  Title,
  Right,
  Icon
} from "native-base";
import { Col, Row, Grid } from "react-native-easy-grid";
import { Actions } from "react-native-router-flux";
import { map } from "lodash";

// Components
import ProductForms from "./Parts/Home/ProductForms";
import MaterialGroups from "./Parts/Home/MaterialGroups";
import IsUsed from "./Parts/Home/IsUsed";
import FooterTabs from "./Parts/Footer";
import Loading from "./Loading";

// Constants
import {
  PRODUCT_FORMS,
  MATERIAL_GROUPS,
  IS_USED
} from "../../constants/filters";

// Styles
import HomeStyles from "../../../native-base-theme/custom/Parts/HomeStyles";

// Actions
import {
  getProductForms,
  getMaterialGroups,
  getUnits
} from "../../actions/masters";
import {
  updateFilteredConfigs,
  updateFilteredFeeds
} from "../../actions/filters";
import { updateFilterSelected } from "../../actions/filters";
import {
  goLoading,
  resetStoreContextData,
  byPassHome,
  inBarlow,
  inHydro
} from "../../actions/navigation";

// Utilities
import { filterItemNotFound } from "../../utils/toastMessages";
import { configTemplates } from "../../utils/filters";

// i18n
import { translate } from "../../i18n";
import commonColor from "../../../native-base-theme/variables/commonColor";
// import Icon from '../../../native-base-theme/components/Icon';

const Home = class Home extends React.Component {
  constructor(props) {
    super(props);
  }



  filterGoHandler = async () => {
    // await this.props.byPassHome(false);
    await this.props.goLoading(true);
    this.props.inBarlow(false);
    this.props.inHydro(false);

    const {
      filters: { productForms, materialGroups, isUsed }
    } = this.props;



    console.log("printint prouct id");
    // //console.log(filters.productforms);

    await this.props
      .updateFilteredConfigs({ productForms, materialGroups, isUsed })
      .then(filteredConfigs => {
        let configUids = [];
        console.log("got config shit");
        map(filteredConfigs.payload, (config, index) => {
          configUids.push(config.uid);
        });

        if (configUids.length > 0) {
          this.props
            .updateFilteredFeeds(configUids)
            .then(updateFilteredFeeds => {
              console.log("got template shit");
              if (updateFilteredFeeds.payload.length > 0) {
                if (updateFilteredFeeds.payload.length === 1) {
                  // Case: Single Spec

                  let filterObject = [
                    {
                      item: "feed",
                      value: updateFilteredFeeds.payload[0].uid
                    },
                    {
                      item: "config",
                      value: configUids[0]
                    }
                  ];

                  this.props.updateFilterSelected(filterObject).then(res => {
                    const templates = configTemplates(
                      filteredConfigs.payload,
                      configUids[0]
                    );

                    if (templates.length > 0) {
                      if (templates.length === 1) {
                        // Case: Single Spec with only one Template
                        let filterObjectTemplate = [
                          {
                            item: "template",
                            value: templates[0].templateUid
                          }
                        ];
                        // //console.log("prenting template for single spec");
                        // //console.log(filterObjectTemplate);
                        // //console.log(productForms[0] + " " + isUsed[0]);

                        this.props
                          .updateFilterSelected(filterObjectTemplate)
                          .then(res => {
                            // //console.log(this.props);
                            this.props.goLoading(false);
                            this.props.resetStoreContextData();

                            //console.log("printing props in single pipe spec");
                            //console.log(this.props);
                            Actions[
                              `filterMain__${productForms[0]}_${isUsed[0]}`
                            ]();
                          });
                      } else {
                        // Case: Single Spec with multiple Templates
                        //console.log("Single Spec with multiple Templates");
                        // //console.log(templates);
                        // //console.log(this.props);
                        this.props.goLoading(false);
                        Actions.filtersMain();
                      }
                    } else {
                      // Case: Single Spec found with no Templates inside
                      this.props.goLoading(false);
                      Toast.show(filterItemNotFound);
                    }
                  });
                } else {
                  // Case: Multiple Specs
                  //console.log("multiple specs");

                  this.props.goLoading(false);
                  Actions.filtersMain();
                }
              }

              else {
                // Case: No Specs found
                this.props.goLoading(false);
                Toast.show(filterItemNotFound);
              }
            })
            .catch(err => {
              //console.log(err);
            });
        }
        //hardcode redirection for fittings or forged or branch
        else if (this.props.navigation.fromfitting || this.props.navigation.fromforged || this.props.navigation.frombranch){
          this.props.goLoading(false);
          Actions.filtersMain();
        }
        else {
          // Case: no configuration found for selected filters
          this.props.goLoading(false);
          Toast.show(filterItemNotFound);
        }
      })
      .catch(err => {
        //console.log(err);
      });
  };

  render() {
    const { go, modal } = HomeStyles;

    const {
      masters: {
        loadState: {
          productForms: productFormsState,
          materialGroups: materialGroupsState,
          units: unitsState
        }
      },
      locale,
      navigation: { goLoading, isHomeByPass }
    } = this.props;

    if (!productFormsState || !materialGroupsState || !unitsState) {
      return <Loading />;
    }

    return (
      <Container>
        <Content contentContainerStyle={{ flexGrow: 1 }}>
          {
            <Modal
              animationType="fade"
              transparent={true}
              visible={isHomeByPass}
              onRequestClose={() => {
                //console.log("modal closed");
              }}
            >
              <View style={{ ...modal }}>
                <Loading loadingText={translate("RetrievingData", locale)} />
              </View>
            </Modal>
          }
          {
            <Grid>
              <MaterialGroups />
              <ProductForms />
              <IsUsed />

              <Row size={10}>
                <Col size={1}>
                  <Button
                    block
                    bordered
                    primary
                    onPress={this.filterGoHandler}
                    style={{ ...go.buttonApply }}
                  >
                    {!goLoading && <Text>{translate("Apply", locale)}</Text>}

                    {goLoading && (
                      <React.Fragment>
                        <Text>{translate("Loading", locale)}</Text>
                        <ActivityIndicator {...go.loading} />
                      </React.Fragment>
                    )}
                  </Button>
                </Col>
              </Row>
            </Grid>
          }
        </Content>
        <FooterTabs />
      </Container>
    );
  }
};

const mapStateToProps = ({ navigation, locale, masters, assets, filters }) => ({
  navigation,
  locale,
  masters,
  assets,
  filters
});

export default connect(
  mapStateToProps,
  {
    getProductForms,
    getMaterialGroups,
    updateFilteredConfigs,
    updateFilteredFeeds,
    updateFilterSelected,
    getUnits,
    goLoading,
    resetStoreContextData,
    byPassHome,
    inBarlow,
    inHydro
  }
)(Home);
