var MOVE_LEFT =     0x01;
var MOVE_RIGHT =    0x02;

var embox2dMyWorld = function() {
    this.rearWheelJoint = null;
    this.moveFlags = 0;
    this.ballBody = null;
    this.wheelBody = null;
    this.positionX = 0;
    this.positionY = 0;
    this.nextPositionX = 100;
    this.nextPositionX = 100;
    this.startTimer = new Date().getTime();
    this.timer = 0;
    this.distance = 0;
    this.speed = 50;
    this.contact = false;
}

embox2dMyWorld.prototype.setNiceViewCenter = function() {
    PTM = 28;
    setViewCenterWorld( new b2Vec2(0,1), true );
}

embox2dMyWorld.prototype.setup = function() {

    //ground
    {
        var ground = world.CreateBody( new b2BodyDef() );
        var shape = new b2EdgeShape();

        var fd = new b2FixtureDef();
        fd.set_shape(shape);
        fd.set_density(0.0);
        fd.set_friction(0.1);

        shape.Set(new b2Vec2(0, 10), new b2Vec2(-5, 10));
        ground.CreateFixture(fd);

        shape.Set(new b2Vec2(-5, 10), new b2Vec2(-5, 5));
        ground.CreateFixture(fd);

        shape.Set(new b2Vec2(-5, 5), new b2Vec2(0, 5));
        ground.CreateFixture(fd);

        shape.Set(new b2Vec2(0, 5), new b2Vec2(0, 0));
        ground.CreateFixture(fd);

        shape.Set(new b2Vec2(0, 0), new b2Vec2(100, 0));
        ground.CreateFixture(fd);
    }

    //ball
    {
        var circleShape = new b2CircleShape();
        circleShape.set_m_radius(0.5);

        var bd = new b2BodyDef();
        bd.set_type(b2_dynamicBody);
        bd.set_position( new b2Vec2(-2.5, 7.5) );
        this.ballBody = world.CreateBody(bd);
        
        var fd = new b2FixtureDef();
        fd.set_shape(circleShape);
        fd.set_density(1.0);
        fd.set_friction(0.1);
        
        bd.set_position( new b2Vec2(-2.5, 7.5) );
        this.wheelBody = world.CreateBody(bd);
        this.wheelBody.CreateFixture(fd);
        
        var m_hz = 50.0;
        var m_zeta = 10.0;
        var m_speed = 50.0;
        
        var jd = new b2WheelJointDef();
        var axis = new b2Vec2(0.0, 1.0);

        jd.Initialize(this.ballBody, this.wheelBody, this.wheelBody.GetPosition(), axis);
        jd.set_motorSpeed(0.0);
        jd.set_maxMotorTorque(250.0);
        jd.set_enableMotor(true);
        jd.set_frequencyHz(m_hz);
        jd.set_dampingRatio(m_zeta);
        this.rearWheelJoint = Box2D.castObject( world.CreateJoint(jd), b2WheelJoint );

        this.ballBody.SetLinearVelocity(new b2Vec2(50, 0));
    }
}

embox2dMyWorld.prototype.groundObject = function() {
    
    var ground = world.CreateBody( new b2BodyDef() );
    var shape = new b2EdgeShape();

    var fd = new b2FixtureDef();
    fd.set_shape(shape);
    fd.set_density(0.0);
    fd.set_friction(0.1);

    shape.Set(new b2Vec2(this.positionX, 0), new b2Vec2(this.positionX + 200, 0));
    ground.CreateFixture(fd);
}

embox2dMyWorld.prototype.randomObject = function() {
    
    var box = new b2PolygonShape();
    box.SetAsBox(0.5, 0.5);
    
    for (var i=0; i<5; i++) {
        
        var bd = new b2BodyDef();
        bd.set_type(b2_dynamicBody);
        bd.set_position(new b2Vec2(this.positionX + 150, i+0.5));

        var bobox = world.CreateBody(bd);
        bobox.CreateFixture(box, 0.5);
    }
}

embox2dMyWorld.prototype.contactObject = function() {
    
    var edge = this.wheelBody.GetContactList();
    while(edge) {
        var other = edge.get_other();
        if(other != undefined) {
            if (other.GetType() == b2_dynamicBody) {
                this.contact = true;
            }
        }
        edge = edge.next;
    }
}

embox2dMyWorld.prototype.updateMotorSpeed = function() {
    if ( (this.moveFlags & MOVE_LEFT) == MOVE_LEFT ) {
        this.rearWheelJoint.SetMotorSpeed( -(this.speed / 2) );
    } else if ( (this.moveFlags & MOVE_RIGHT) == MOVE_RIGHT ) {
        this.rearWheelJoint.SetMotorSpeed( -(this.speed * 2) );
    } else {
        this.rearWheelJoint.SetMotorSpeed(-this.speed);
    }
}

embox2dMyWorld.prototype.up = function() {    
    if (this.ballBody.GetPosition().get_y() < 1) {
        this.ballBody.SetLinearVelocity(new b2Vec2(this.ballBody.GetLinearVelocity().get_x(), 20));
    }
}

embox2dMyWorld.prototype.down = function() {    
    if (this.ballBody.GetPosition().get_y() > 1) {
        this.ballBody.SetLinearVelocity(new b2Vec2(this.ballBody.GetLinearVelocity().get_x(), -35));
    }
}

embox2dMyWorld.prototype.step = function() {

    var time = new Date().getTime();
    this.timer = time - this.startTimer;
    this.speed = (this.timer / 100) + 50;
    this.updateMotorSpeed();

    var pos = this.ballBody.GetPosition();
    var vel = this.ballBody.GetLinearVelocity();
    var futurePos = new b2Vec2( pos.get_x() + 0.15 * vel.get_x(), pos.get_y() + 0.15 * vel.get_y() );
    this.positionX = pos.get_x() + 0.15 * vel.get_x();
    this.positionY = pos.get_y() + 0.15 * vel.get_y();
    this.distance = this.positionX;
    setViewCenterWorld( futurePos );

    if(this.positionX + 100 >= this.nextPositionX) {
        this.groundObject();
        this.randomObject();
        this.nextPositionX += 100;
    }

    this.contactObject();
}

embox2dMyWorld.prototype.onKeyDown = function(canvas, evt) {
    if(finish != true) {
        if ( evt.keyCode == 37 ) {
            this.moveFlags |= MOVE_LEFT;
            this.updateMotorSpeed();
        }
        else if ( evt.keyCode == 39 ) {
            this.moveFlags |= MOVE_RIGHT;
            this.updateMotorSpeed();
        }
        
        if ( evt.keyCode == 38 ) {
            this.up();
        } else if (evt.keyCode == 40 ) {
            this.down();
        }
    }
}

embox2dMyWorld.prototype.onKeyUp = function(canvas, evt) {    
    if(finish != true) {
        if ( evt.keyCode == 37 ) {
            this.moveFlags &= ~MOVE_LEFT;
            this.updateMotorSpeed();
        }
        else if ( evt.keyCode == 39 ) {
            this.moveFlags &= ~MOVE_RIGHT;
            this.updateMotorSpeed();
        }
    }
}

embox2dMyWorld.prototype.getTimer = function() {    
    return this.timer;
}

embox2dMyWorld.prototype.getDistance = function() {    
    return this.distance;
}

embox2dMyWorld.prototype.getContact = function() {    
    return this.contact;
}