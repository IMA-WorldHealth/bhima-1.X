<div class="form-group" ng-repeat="unit in units">
				<label for={{unit.id}}>{{unit.name}} {{unit.desc}}</label>
				<input type="checkbox" id={{unit.id}}>
				</div>
