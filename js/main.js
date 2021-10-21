const filterString = (str) => str
	.replace(/\s+/g, '\x20')
	.trim()
	.toLowerCase()
	.normalize('NFD')
	.replace(/[^\x20-\x7f]/g, '');

const softCompare = (a, b) => filterString(a) === filterString(b);

const categoriesToString = (categories) => {
	return categories
		.map((category) => category.name)
		.join('; ');
};

const getDB = async () => {
	const text = await $.ajax({
		url: './list.txt',
		method: 'GET',
	});
	const lines = text.trim().split(/\s*\n\s*/);
	let currentCategories = [];
	const categories = [];
	const addCategory = (name) => {
		let category = categories.find((item) => softCompare(item.name, name));
		if (category != null) return category;
		const id = categories.length + 1;
		category = { id, name };
		categories.push(category);
		return category;
	};
	const items = [];
	for (let line of lines) {
		if (line.startsWith('*')) {
			const names = line.substr(1).trim().split(/\s*\+\s*/);
			currentCategories = [];
			for (let name of names) {
				category = addCategory(name);
				currentCategories.push(category);
			}
			continue;
		}
		const name = line.replace(/^\!\s*/, '');
		const search = filterString(name);
		items.push({
			name,
			categories: currentCategories.slice(),
			inventory: !line.startsWith('!'),
			search,
		});
	}
	return { items, categories };
};

const appendItem = (item, parent) => {
	parent.append(`<div class="item"></div>`)
	const div = parent.children().last();
	div.append(`
		<div class="name"></div>
		<div class="info"></div>
		<div class="info"></div>
	`);
	div.find('.name').text(item.name);
	div.find('.info').eq(0).text(categoriesToString(item.categories));
	div.find('.info').eq(1).text(`Em estoque: ${item.inventory ? 'sim' : 'não'}`);
	if (!item.inventory) {
		div.addClass('empty-inventory');
	}
};

const updateList = ({ items }) => {
	const list = $('#list');
	list.html('');
	const catId = parseInt($('select').val());
	const search = filterString($('input').val());
	const result = items.filter((item) => {
		if (
			catId !== 0 &&
			!item.categories.find(({ id }) => id === catId)
		) return false;
		if (!item.search.includes(search)) return false;
		return true;
	});
	for (let item of result) {
		appendItem(item, list);
	}
};

$(document).ready(async () => {
	const db = await getDB();
	const { items, categories } = db;
	const typesHTML = `<option value="0">Tudo</option>`
		+ categories.map(({ name, id }) => `<option value="${id}">${name}</option>`);
	$('select').html(typesHTML);
	items.sort((a, b) => a.search < b.search ? -1 : a.search > b.search ? 1 : 0);
	updateList(db);
	$('select,input').on('input', () => {
		updateList(db);
	});
});
