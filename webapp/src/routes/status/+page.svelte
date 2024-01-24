<script lang="ts">
	import {
		epochEnd,
		epochNumber,
		epochRemaining,
		epochWaitingAdvance,
		epochRemainingHours,
		epochRemainingMinutes,
		epochRemainingSeconds,
		lastEpoch,
		lastEpochRevealed,
		lastEpochDrop
	} from '$lib/epoch';
	import { t } from '$lib/i18n';
</script>

<p>Status</p>

<div class="table-container p-8">
	<table class="table">
		<thead>
			<tr>
				<th>Name</th>
				<th>Value</th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<td>Epoch Number</td>
				<td>{$epochNumber}</td>
			</tr>
			<tr>
				<td>Epoch End Date</td>
				<td>{$epochEnd}</td>
			</tr>
			<tr>
				<td>Epoch Time Remaining</td>
				<td
					>{$epochRemaining} ({$epochRemainingHours} hours, {$epochRemainingMinutes} minutes, {$epochRemainingSeconds}
					seconds)</td
				>
			</tr>
			<tr>
				<td>Awaiting Epoch Advance?</td>
				<td>{$epochWaitingAdvance}</td>
			</tr>
			<tr>
				<td>Last Epoch</td>
				<td>{$lastEpoch}</td>
			</tr>
			<tr>
				<td>Last Epoch Revealed?</td>
				<td>{$lastEpochRevealed}</td>
			</tr>
			<tr>
				<td>Last Epoch Drop</td>
				<td>{$lastEpochDrop}</td>
			</tr>
		</tbody>
	</table>
</div>

<style lang="postcss">
</style>
