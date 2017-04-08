/**
 * @todo Directive
 */
angular.module('lisk_explorer')
.filter('proposal', $sce => (name, proposals, property) => {
    let temp = (proposals && name) ? proposals[name.toLowerCase()] : null;
    return temp && property ? temp[property] : temp;
});
