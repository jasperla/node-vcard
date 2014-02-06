var vCard,
    vCardString,
    assert = require('assert-plus'),
    fs = require('fs'),
    VCard = require('../vcard');

beforeEach(function(){
    vCard = new VCard();
});

testAllCardsInFolder = function (folderPath) {
    if (!fs.existsSync(folderPath)) {
        return
    }

    fs.readdirSync(
        folderPath
    ).filter(function (path) {
        return path.match(/.vcf$/)
    }).forEach(function (path) {
        describe(path, function(){
            var vCardString = fs.readFileSync(folderPath + path, {encoding: 'ascii'})

            it('is loaded into memory', function () {
                assert.string(vCardString);
            })
            it('is parsed', function(done){
                vCard.readData(vCardString, function (err, json) {
                    assert.equal(null, err)
                    done()
                })
            })
        })

    })
}

describe('Setup', function () {
    it('VCard is a constructor function.', function(){
        assert.func(VCard);
    });

});
describe('VCard', function(){

    testAllCardsInFolder('./spec/');
    testAllCardsInFolder('./spec/private-vcards/');


});
