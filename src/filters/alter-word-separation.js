import AppFilters from './filters.module';

AppFilters.filter('alterWordSeparation', () => {
      // @todo Use polymer instead
      if (!String.prototype.trim) {
          String.prototype.trim = function () {
              return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
          };
      }
      const types = {
          dashSeparated: {
              reg: /\s/g,
              alternate: '-'
          },
          spaceSeparated: {
              reg: /\-/g,
              alternate: ' '
          }
      };
      return (phrase, type) => {
          if (type in types) {
              return phrase.trim().replace(types[type].reg, types[type].alternate);

          }
      };
  });