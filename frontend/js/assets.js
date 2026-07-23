function assetRows() {
  const query = $('#assetSearch').value.toLowerCase();
  const filtered = assets.filter((asset) => {
    const searchableText = [
      valueFrom(asset, 'asset_tag', 'tag'),
      valueFrom(asset, 'asset_name', 'name'),
      valueFrom(asset, 'category'),
      valueFrom(asset, 'serial_number')
    ].join(' ');

    return searchableText.toLowerCase().includes(query);
  });

  const rows = filtered.map((asset) => `
    <tr>
      <td>
        <strong>${escapeHtml(valueFrom(asset, 'asset_tag', 'tag'))}</strong>
        <div class="small text-secondary">
          ${escapeHtml(valueFrom(asset, 'asset_name', 'name'))}
        </div>
      </td>
      <td>${escapeHtml(valueFrom(asset, 'category'))}</td>
      <td>${escapeHtml(valueFrom(asset, 'serial_number'))}</td>
      <td>${statusBadge(valueFrom(asset, 'status'))}</td>
      <td>${escapeHtml(valueFrom(asset, 'condition'))}</td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-primary" onclick="editAsset('${getId(asset)}')">
          Edit
        </button>
        <button class="btn btn-sm btn-outline-danger ms-1" onclick="deleteAsset('${getId(asset)}')">
          Delete
        </button>
      </td>
    </tr>
  `).join('');

  $('#assetTable').innerHTML = rows || `
    <tr>
      <td colspan="6" class="text-center text-secondary p-4">No assets found.</td>
    </tr>
  `;
}

async function loadAssets() {
  showLoading('#assetTable', 6);
  try {
    assets = toList(await api('/assets'));
    assetRows();
  } catch (error) {
    $('#assetTable').innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-danger p-4">
          ${escapeHtml(error.message)}
        </td>
      </tr>
    `;
  }
}

window.editAsset = (id) => {
  const asset = assets.find((item) => String(getId(item)) === String(id));
  if (!asset) return;
  $('#assetModalTitle').textContent = 'Edit asset';
  $('#assetId').value = getId(asset);
  $('#assetTag').value = valueFrom(asset, 'asset_tag', 'tag');
  $('#assetName').value = valueFrom(asset, 'asset_name', 'name');
  $('#assetCategory').value = valueFrom(asset, 'category');
  $('#assetSerial').value = valueFrom(asset, 'serial_number');
  $('#assetPurchaseDate').value = dateInputValue(
    valueFrom(asset, 'purchase_date')
  );
  $('#assetStatus').value = valueFrom(asset, 'status') || 'Available';
  $('#assetCondition').value = valueFrom(asset, 'condition') || 'Good';
  showModal('#assetModal');
};

window.deleteAsset = async (id) => {
  if (!confirm('Delete this asset?')) return;
  try {
    await api(`/assets/${id}`, { method: 'DELETE' });
    notify('Asset deleted.');
    loadAssets();
  } catch (error) {
    notify(error.message, 'danger');
  }
};


function setupAssetPage() {
  loadAssets();
  $('#assetSearch').oninput = assetRows;

  $('#addAssetBtn').onclick = () => {
    $('#assetForm').reset();
    $('#assetId').value = '';
    $('#assetModalTitle').textContent = 'Add asset';
  };

  handleFormSubmit($('#assetForm'), async () => {
    const id = $('#assetId').value;
    const data = formValues([
      ['asset_tag', '#assetTag'],
      ['asset_name', '#assetName'],
      ['category', '#assetCategory'],
      ['serial_number', '#assetSerial'],
      ['purchase_date', '#assetPurchaseDate'],
      ['status', '#assetStatus'],
      ['condition', '#assetCondition']
    ]);

    try {
      await api(`/assets${id ? `/${id}` : ''}`, {
        method: id ? 'PUT' : 'POST',
        body: JSON.stringify(data)
      });
      hideModal('#assetModal');
      notify(`Asset ${id ? 'updated' : 'added'}.`);
      loadAssets();
    } catch (error) {
      notify(error.message, 'danger');
    }
  });
}

